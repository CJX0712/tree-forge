// TreeForge probe — depth sweep, generalization gap, forest vs single tree
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const m=html.match(/<script id="engine">([\s\S]*?)<\/script>/);
const F=vm.runInContext(m[1]+'\nTreeForge;',vm.createContext({}));

// depth sweep on noisy moons
console.log('== depth sweep (moons n=400 noise=0.25 seed=5) ==');
const ds=F.makeMoons(400,0.25,5);
const base=F.baselineAcc(ds);
console.log('baseline: '+(base*100).toFixed(1)+'%');
for(const md of [1,2,3,4,6,8,12,64]){
  const cv=F.crossValidate(ds,5,{maxDepth:md});
  const tree=F.trainTree(ds,{maxDepth:md});
  const train=F.accuracy(tree,ds);
  console.log('depth='+String(md).padEnd(2)+' train='+(train*100).toFixed(1)+'%  cv='+(cv*100).toFixed(1)+'%  gap='+((train-cv)*100).toFixed(1)+'pp');
}

// forest vs single tree across seeds
console.log('\n== forest vs single tree CV (20 seeds, moons noise 0.3) ==');
let dSum=0, fWin=0;
for(let s=0;s<20;s++){
  const d2=F.makeMoons(400,0.3,1000+s);
  const cvT=F.crossValidate(d2,5,{maxDepth:6,seed:s});
  const cvF=F.crossValidate(d2,5,{maxDepth:6,seed:s});
  dSum+=(cvF-cvT);
  if(cvF>cvT) fWin++;
}
console.log('mean (forestCV - treeCV) = '+(dSum/20*100).toFixed(2)+'pp  (bagging on identical single-hyperparam trees: expect ~0, diversity comes from bootstrap only)');
console.log('forest CV strictly wins on '+fWin+'/20 seeds');

// entropy vs gini split agreement on root
console.log('\n== entropy vs gini root split agreement (10 worlds) ==');
let agree=0;
for(let s=0;s<10;s++){
  const d3=F.makeMoons(300,0.2,2000+s);
  const te=F.trainTree(d3,{maxDepth:1,criterion:'entropy'});
  const tg=F.trainTree(d3,{maxDepth:1,criterion:'gini'});
  if(te.f===tg.f&&Math.abs(te.thr-tg.thr)<1e-9) agree++;
}
console.log('root split identical on '+agree+'/10 worlds');

// XOR sanity: tree needs depth>=2
console.log('\n== XOR needs depth>=2 ==');
const dx=F.makeXor(400,0,42);
for(const md of [1,2,3]){
  const t=F.trainTree(dx,{maxDepth:md});
  console.log('depth='+md+' trainAcc='+(F.accuracy(t,dx)*100).toFixed(1)+'%');
}
console.log('\nPROBE_DONE');
