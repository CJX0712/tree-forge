# TreeForge ⚒ 决策树锻造炉

<p align="center">
  <a href="https://github.com/CJX0712/tree-forge/actions/workflows/ci.yml"><img src="https://github.com/CJX0712/tree-forge/actions/workflows/ci.yml/badge.svg" alt="ci"></a>
  <a href="https://github.com/CJX0712/tree-forge/releases"><img src="https://img.shields.io/github/v/release/CJX0712/tree-forge?sort=semver" alt="release"></a>
  <a href="https://github.com/CJX0712/tree-forge/blob/main/LICENSE"><img src="https://img.shields.io/github/license/CJX0712/tree-forge" alt="license"></a>
  <img src="https://img.shields.io/badge/author-%E6%99%A8%E6%98%9F-1f6feb" alt="author">
</p>

单文件 HTML（内联 CSS/JS，零外部依赖）的**手写决策树 + 随机森林**可视化实验场。
纯 JavaScript 实现 CART / ID3 风格的轴对齐分裂树，无任何 ML 库。

## 功能

- **三种数据集**：双月牙 / 同心环 / XOR 象限，噪声可调，一键重生成
- **双准则**：信息增益（熵，ID3 风格）/ Gini 不纯度（CART）
- **预剪枝**：最大深度 1–10 可调
- **随机森林**：Bootstrap Bagging（5–41 棵），多数投票
- **可视化**：单树与森林的决策边界着色、树结构 SVG 图、精度对比条
- **5 折交叉验证** vs 多数类基线，实时统计训练精度 / 深度 / 节点数

## 不变量（内置自检，8 项）

| # | 不变量 | 说明 |
|---|--------|------|
| 1 | 根分裂最优性 | 树选择的分裂增益 == 暴力枚举全部 (特征, 阈值) 候选独立重算的最大增益（1e-9） |
| 2 | 无限深训练精度 == 100% | 纯叶终止，训练集全可分时零训练误差 |
| 3 | 叶预测 == 路由样本多数类 | 每个训练样本路由到叶后，预测与独立重算的叶内多数类一致 |
| 4 | 熵 / Gini 双准则均 100% 拟合 | 两种准则实现等价可用 |
| 5 | 5 折 CV ≥ 基线 + 10pp | 泛化有效性（非纯记忆） |
| 6 | 预剪枝有效 | maxDepth=2 的树深度 ≤ 2（边深度语义）且节点数 < 全量树 |
| 7 | 森林多样性 | 不同 Bootstrap 树存在预测分歧（非退化复制） |
| 8 | 种子确定性 | 同种子训练产生逐字节一致的树结构 |

## 有趣的发现（探针实验）

- **XOR 与贪心决策树**：理想 XOR 数据的根节点信息增益恰为 0（任何单变量轴对齐分裂两侧都是 50/50），这是贪心分裂的经典盲区。但**有限样本**的类别随机不平衡会产生 ~1e-2 的残余增益，贪心树借此打破对称、逐层破开 XOR——实测 400 样本全深度（7 层）可达 100% 训练精度；浅深度（≤3）则完全学不动（~57%）。
- **同参 Bagging 的极限**：所有树共用同一超参数、仅靠 Bootstrap 采样制造差异时，在低噪声数据上森林 CV 与单树几乎无差异（20 种子均值 0.00pp）——随机森林的增益需要更深的树或额外的特征/阈值随机性。
- **熵 vs Gini**：10 个随机世界上根分裂一致率 6/10，两者高频但不总是一致。
- **深度—泛化曲线**：双月牙 noise=0.25 下 CV 在深度 6 达 97.3% 后平台化，训练-CV gap 稳定在 ~2.5pp。

## 运行

浏览器直接打开 `index.html` 即可。无头校验：

```bash
node _smoke.js   # 8 项不变量，全过输出 SUMMARY: 8/8
node _probe.js   # 深度扫描 / 森林对照 / XOR 探针
```

## License

MIT
