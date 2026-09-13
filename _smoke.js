// TreeForge headless self-test — mirrors the 8 invariants from index.html
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const m=html.match(/<script id="engine">([\s\S]*?)<\/script>/);
if(!m){ console.log('FAIL: engine script not found'); process.exit(1); }
const F=vm.runInContext(m[1]+'\nTreeForge;',vm.createContext({}));

let pass=0, total=0;
function T(name,ok,detail){
  total++;
  if(ok) pass++;
  console.log((ok?'PASS':'FAIL')+'  '+name+(detail?'  | '+detail:''));
}

// independent brute-force max gain (separate implementation)
function bruteMaxGain(ds,criterion){
  const X=ds.X,y=ds.y,n=X.length;
  const counts=[0,0];
  for(let i=0;i<n;i++) counts[y[i]]++;
  const base=F.impurity(criterion,counts,n);
  let mg=-1;
  for(let f=0;f<2;f++){
    const vals=X.map(p=>p[f]).sort((a,b)=>a-b);
    const uniq=vals.filter((v,i)=>i===0||v!==vals[i-1]);
    for(let k=0;k<uniq.length-1;k++){
      const thr=(uniq[k]+uniq[k+1])/2;
      const lc=[0,0],rc=[0,0];
      for(let i=0;i<n;i++){ if(X[i][f]<=thr) lc[y[i]]++; else rc[y[i]]++; }
      if(lc[0]+lc[1]===0||rc[0]+rc[1]===0) continue;
      const nl=lc[0]+lc[1],nr=rc[0]+rc[1];
      const g=base-(nl/n)*F.impurity(criterion,lc,nl)-(nr/n)*F.impurity(criterion,rc,nr);
      if(g>mg) mg=g;
    }
  }
  return mg;
}

// 1) root split optimality vs brute-force enumeration
{
  const ds=F.makeMoons(300,0.12,101);
  const tree=F.trainTree(ds,{maxDepth:64,criterion:'entropy'});
  const mg=bruteMaxGain(ds,'entropy');
  T('root split == brute-force max gain (1e-9)',Math.abs(tree.gain-mg)<1e-9,'tree='+tree.gain.toFixed(10)+' brute='+mg.toFixed(10));
}
// 2) unconstrained tree fits train 100%
{
  const ds=F.makeMoons(300,0.08,7);
  const tree=F.trainTree(ds,{maxDepth:64,minSplit:2});
  const acc=F.accuracy(tree,ds);
  T('unconstrained train accuracy == 1.0',acc===1,'acc='+acc);
}
// 3) leaf pred == recomputed majority of routed samples
{
  const ds=F.makeMoons(240,0.18,11);
  const tree=F.trainTree(ds,{maxDepth:64,minSplit:8});
  const leafStats=new Map();
  let ok=true,bad='';
  for(let i=0;i<ds.X.length;i++){
    const leaf=F.leafOf(tree,ds.X[i]);
    let st=leafStats.get(leaf);
    if(!st){ st=[0,0]; leafStats.set(leaf,st); }
    st[ds.y[i]]++;
  }
  for(const [leaf,st] of leafStats){
    const maj=st[1]>st[0]?1:0;
    if(leaf.pred!==maj){ ok=false; bad='leaf pred='+leaf.pred+' recomputed='+maj; break; }
  }
  T('leaf prediction == routed-sample majority',ok,bad||('leaves='+leafStats.size));
}
// 4) both criteria 100% fit
{
  const ds=F.makeCircles(240,0.1,21);
  const a=F.accuracy(F.trainTree(ds,{criterion:'entropy'}),ds);
  const b=F.accuracy(F.trainTree(ds,{criterion:'gini'}),ds);
  T('entropy & gini both 100% train fit',a===1&&b===1,'entropy='+a+' gini='+b);
}
// 5) CV >= baseline + 10pp
{
  const ds=F.makeMoons(400,0.15,5);
  const cv=F.crossValidate(ds,5,{maxDepth:6});
  const base=F.baselineAcc(ds);
  T('5-fold CV >= baseline+10pp',cv>=base+0.10,'cv='+(cv*100).toFixed(1)+'% base='+(base*100).toFixed(1)+'%');
}
// 6) pruning bounds depth & shrinks tree
{
  const ds=F.makeMoons(300,0.15,9);
  const full=F.trainTree(ds,{maxDepth:64});
  const pruned=F.trainTree(ds,{maxDepth:2});
  T('pruning: depth<=2 and nodes < full',F.treeDepth(pruned)<=2&&F.countNodes(pruned)<F.countNodes(full),'pruned='+F.countNodes(pruned)+' full='+F.countNodes(full));
}
// 7) forest diversity
{
  const ds=F.makeMoons(200,0.2,33);
  const f=F.trainForest(ds,{trees:9,seed:77});
  let allSame=true;
  outer:
  for(let i=0;i<ds.X.length;i++){
    for(let t=1;t<9;t++){
      if(F.predictNode(f.trees[0],ds.X[i])!==F.predictNode(f.trees[t],ds.X[i])){ allSame=false; break outer; }
    }
  }
  T('forest diversity: trees disagree somewhere',!allSame);
}
// 8) determinism
{
  const ds=F.makeXor(240,0,42);
  const t1=F.serialize(F.trainTree(ds,{seed:9}));
  const t2=F.serialize(F.trainTree(ds,{seed:9}));
  T('seed determinism: byte-identical trees',t1===t2,'len='+t1.length);
}

console.log('SUMMARY: '+pass+'/'+total);
process.exit(pass===total?0:1);
