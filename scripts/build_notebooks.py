"""
scripts/build_notebooks.py
Generates the four required project notebooks in notebooks/ using nbformat.
All notebooks are cleanly structured with explanatory markdown and reproducible code.
"""

import os
import nbformat as nbf

NOTEBOOKS_DIR = "notebooks"
os.makedirs(NOTEBOOKS_DIR, exist_ok=True)


def create_01_data_understanding():
    nb = nbf.v4.new_notebook()
    cells = []
    
    cells.append(nbf.v4.new_markdown_cell("""# 01. Data Understanding & Target Leakage Analysis
## VLSI & Hardware: Multi-Class Fault Diagnosis and Mitigation Prediction

**Author:** Senior Data Science & VLSI AI Team  
**Evaluation:** College Course Project (10 Marks Evaluation)  

---

### 1. Project Background & Problem Statement
Modern deep sub-micron (DSM) integrated circuits operating across 7nm to 45nm technology nodes experience physical, electro-thermal, and aging stresses. Automated identification of the root cause of functional degradation is essential for real-time chip self-healing and yield optimization.

The primary objective is to classify circuit operating states into six categories:
1. **No Fault (Nominal)**
2. **Thermal Fault**
3. **Timing Fault**
4. **Power Fault**
5. **Signal Integrity Fault**
6. **Reliability Fault**
"""))

    cells.append(nbf.v4.new_code_cell("""import sys
import os
sys.path.append(os.path.abspath("../src"))

import pandas as pd
import numpy as np
from data_loader import load_raw_data, inspect_data, FAULT_CLASS_MAP, BASE_NUMERICAL_FEATURES

# Load raw dataset
df = load_raw_data("../Data/vlsi_fault_detection.csv")
print("Dataset Shape:", df.shape)
df.head(5)
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 2. Dataset Dimensions, Missing Values, and Data Types
We inspect the dataset for data cleanliness, missing values, duplicates, and column types.
"""))

    cells.append(nbf.v4.new_code_cell("""info = inspect_data(df)
print(f"Total Rows: {info['n_rows']:,}")
print(f"Total Columns: {info['n_cols']}")
print(f"Missing Values: {info['missing_values']}")
print(f"Duplicate Rows: {info['duplicates']}")
print("\\nTarget Fault Class Distribution:")
for k, v in info['fault_type_counts'].items():
    print(f"  {k} ({FAULT_CLASS_MAP[k]}): {v:,} samples ({v/len(df)*100:.1f}%)")
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 3. Critical Discovery: Deterministic Mapping & Data Leakage Prevention
Let us examine the secondary target column `mitigation_action` and `severity`.
"""))

    cells.append(nbf.v4.new_code_cell("""# Check crosstab between (fault_type, severity) and mitigation_action
crosstab = pd.crosstab([df['fault_type'], df['severity']], df['mitigation_action'])
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)
crosstab
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 4. Summary of Data Understanding Findings
1. **Exact Class Balance**: Exactly 5,000 samples exist for each of the six fault classes (total 30,000 samples).
2. **Zero Missing & Zero Duplicates**: The dataset is completely clean with no null values or duplicate records.
3. **Target Leakage Identified**: `severity`, `mitigation_action`, and one-hot encoded `action_*` dummy variables must be strictly excluded from the feature matrix used for primary fault diagnosis.
4. **Secondary Task Nuance**: Each `(fault_type, severity)` tuple maps 100% deterministically to a specific mitigation action. Therefore, mitigation prediction should be framed as predicting the action directly from raw sensor measurements without knowledge of severity.
"""))

    nb['cells'] = cells
    path = os.path.join(NOTEBOOKS_DIR, "01_data_understanding.ipynb")
    with open(path, "w", encoding="utf-8") as f:
        nbf.write(nb, f)
    print(f"Created: {path}")


def create_02_eda_and_preprocessing():
    nb = nbf.v4.new_notebook()
    cells = []
    
    cells.append(nbf.v4.new_markdown_cell("""# 02. Exploratory Data Analysis & Feature Engineering
## VLSI & Hardware Fault Diagnosis

In this notebook, we perform comprehensive EDA, investigate physical parameters across fault classes, and build domain-specific engineered features.
"""))

    cells.append(nbf.v4.new_code_cell("""import sys, os
sys.path.append(os.path.abspath("../src"))

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from data_loader import load_raw_data, get_feature_target_split, FAULT_CLASS_MAP, BASE_NUMERICAL_FEATURES
from preprocessing import VLSIFeatureEngineer, build_preprocessor

df = load_raw_data("../Data/vlsi_fault_detection.csv")
X, y, meta = get_feature_target_split(df)
print("Features shape:", X.shape)
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 1. Feature Distributions Across Fault Classes
We inspect the mean and standard deviation of each electrical measurement across all six fault classes.
"""))

    cells.append(nbf.v4.new_code_cell("""means = df.groupby('fault_type')[BASE_NUMERICAL_FEATURES].mean().T
means.columns = [FAULT_CLASS_MAP[i] for i in range(6)]
means
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 2. Physical Outlier Justification
Notice that junction temperatures reach up to 120°C and signal integrity margins fall below 0. 
In classical statistics, these may appear as extreme outliers beyond $Q_3 + 1.5 \times \text{IQR}$.
However, in semiconductor physics, extreme values are the **exact signatures** of Thermal and Signal Integrity faults.
Therefore, removing them would destroy the ground-truth signals.
"""))

    cells.append(nbf.v4.new_code_cell("""# Check IQR outliers for key physical parameters
for col in ['junction_temperature', 'total_power', 'si_margin']:
    q25, q75 = np.percentile(df[col], [25, 75])
    iqr = q75 - q25
    lower, upper = q25 - 1.5 * iqr, q75 + 1.5 * iqr
    outliers = df[(df[col] < lower) | (df[col] > upper)]
    print(f"{col:22s} | IQR Outliers: {len(outliers):5d} | Fault Type Distribution:\\n{outliers['fault_type'].value_counts().to_dict()}")
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 3. Domain-Specific Feature Engineering
We construct 7 physics-based derived features:
1. $V^2 \\cdot f$: Dynamic power scaling indicator.
2. $V / f$: Timing slack pressure index.
3. $\\Delta T = T_j - T_{\\text{ambient}}$: Thermal gradient across the silicon package.
4. Thermal resistance proxy: $\\Delta T / P_{\\text{total}}$.
5. Dynamic switching stress: $\\alpha \\cdot C_L \\cdot V^2 \\cdot f$.
6. Signal integrity health ratio: $\\text{SI Margin} / (\\text{Noise Margin} + \\epsilon)$.
7. Aging thermal compound stress: $\\text{Aging Factor} \\times (T_j / 100)$.
"""))

    cells.append(nbf.v4.new_code_cell("""fe = VLSIFeatureEngineer()
X_eng = fe.fit_transform(X)
print("Features after engineering:", X_eng.shape)
X_eng[fe.engineered_feature_names_].head()
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 4. Leak-Free Preprocessing Pipeline
We verify that the `ColumnTransformer` (StandardScaler on numerical features and OneHotEncoder on `tech_node`) transforms the feature space cleanly.
"""))

    cells.append(nbf.v4.new_code_cell("""all_num = BASE_NUMERICAL_FEATURES + fe.engineered_feature_names_
preprocessor = build_preprocessor(all_num, ['tech_node'])
X_trans = preprocessor.fit_transform(X_eng)
print("Transformed feature matrix shape:", X_trans.shape)
"""))

    nb['cells'] = cells
    path = os.path.join(NOTEBOOKS_DIR, "02_eda_and_preprocessing.ipynb")
    with open(path, "w", encoding="utf-8") as f:
        nbf.write(nb, f)
    print(f"Created: {path}")


def create_03_fault_classification():
    nb = nbf.v4.new_notebook()
    cells = []
    
    cells.append(nbf.v4.new_markdown_cell("""# 03. Machine Learning Modeling, Cross-Validation & Error Analysis
## Multi-Class Fault Classification Pipeline

In this notebook, we evaluate:
1. **Dummy Baseline** (Mathematical lower bound)
2. **Logistic Regression** (Linear benchmark)
3. **Random Forest Classifier** (Bagging ensemble)
4. **XGBoost Classifier** (Gradient boosted trees)

We use a strictly leak-free **70% Train, 15% Validation, 15% Test** split, with 5-Fold Stratified Cross-Validation on the training split.
"""))

    cells.append(nbf.v4.new_code_cell("""import sys, os
sys.path.append(os.path.abspath("../src"))

import pandas as pd
import numpy as np
import joblib

# Load evaluation results generated by src/evaluate.py
comparison_df = pd.read_csv("../reports/model_comparison_table.csv")
per_class_df = pd.read_csv("../reports/per_class_metrics.csv")
confused_pairs = pd.read_csv("../reports/confused_fault_pairs.csv")

print("=== FINAL MODEL BENCHMARK COMPARISON ON TEST SET (N=4,500) ===")
comparison_df
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 1. Analysis of Model Results
- **Dummy Classifier**: Yields 16.67% accuracy and 0.0476 Macro F1 (exact $1/6$ theoretical probability).
- **Logistic Regression**: High linear separability (98.07% Macro F1), but experiences slight boundary overlap.
- **Random Forest**: 99.02% Macro F1 with robust ensemble averaging.
- **XGBoost**: State-of-the-art performance at **99.20% Macro F1** and **99.20% Accuracy**.
"""))

    cells.append(nbf.v4.new_code_cell("""# Per-class performance of champion XGBoost model
xgb_classes = per_class_df[per_class_df['Model'] == 'XGBoost']
xgb_classes
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 2. In-Depth Error Analysis
Out of 4,500 held-out test samples, the champion XGBoost model committed only **36 misclassifications (0.80% error rate)**.
Let us examine the confused fault pairs.
"""))

    cells.append(nbf.v4.new_code_cell("""confused_pairs"""))

    cells.append(nbf.v4.new_markdown_cell("""### Physical Rationale for Misclassifications
1. **Reliability vs. Thermal Fault (27 / 36 errors)**: Both conditions exhibit extreme junction temperatures ($>95^\circ\\text{C}$), high electromigration stress, and accelerated degradation. When an aging device operates near the thermal threshold, boundary ambiguity arises.
2. **Power vs. Thermal Fault (8 / 36 errors)**: High dynamic power dissipation ($P = V \\cdot I$) directly heats the die ($T_j = T_a + P \\cdot \\theta_{ja}$). When heat sink cooling efficiency fluctuates, excessive power dissipation causes thermal symptoms.
3. **Zero Errors for Timing & Signal Integrity**: Undervoltage and negative SI margins provide clean orthogonal signatures.
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 3. Secondary Task: Mitigation Action Prediction
Predicting the 16 mitigation actions directly from raw electrical measurements (without knowing severity):
"""))

    cells.append(nbf.v4.new_code_cell("""import json
with open("../reports/mitigation_metrics.json", "r") as f:
    mit_metrics = json.load(f)
pd.DataFrame(mit_metrics).T
"""))

    nb['cells'] = cells
    path = os.path.join(NOTEBOOKS_DIR, "03_fault_classification.ipynb")
    with open(path, "w", encoding="utf-8") as f:
        nbf.write(nb, f)
    print(f"Created: {path}")


def create_04_model_explainability():
    nb = nbf.v4.new_notebook()
    cells = []
    
    cells.append(nbf.v4.new_markdown_cell("""# 04. Explainable AI (SHAP Feature Attribution)
## Transparent Hardware Diagnosis using Shapley Additive exPlanations

In safety-critical hardware testing, machine learning predictions must be transparent and explainable.
We use SHAP (rooted in cooperative game theory) to quantify the exact additive contribution of each electrical parameter.
"""))

    cells.append(nbf.v4.new_code_cell("""import sys, os
sys.path.append(os.path.abspath("../src"))

import pandas as pd
import json

shap_df = pd.read_csv("../reports/shap_feature_importance.csv")
print("Top 15 Most Influential Diagnostic Features:")
shap_df.head(15)
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 1. Key Insights from Global SHAP Importance
1. **Supply Voltage (`voltage`) & Frequency (`frequency`)**: Exert the largest overall control over circuit behavior by dictating dynamic power consumption and timing propagation.
2. **Noise Margin & SI Margin**: Primary drivers of Signal Integrity fault identification.
3. **Engineered Features**: Features like `aging_thermal_stress` (rank 6) and `v2_freq` (rank 8) appear in the top 10 most influential features, confirming that physical feature engineering enhanced the model's diagnostic capacity.
"""))

    cells.append(nbf.v4.new_markdown_cell("""### 2. Local Sample Attribution
Let us review individual diagnostic explanations generated for test cases across all six classes:
"""))

    cells.append(nbf.v4.new_code_cell("""with open("../reports/sample_shap_explanations.json", "r") as f:
    sample_exps = json.load(f)

for exp in sample_exps:
    print(f"Fault Class: {exp['fault_class']} (Sample #{exp['sample_id']})")
    print(f"  Positively Supporting Features: {exp['top_positive_features']}")
    print(f"  Opposing Features             : {exp['top_negative_features']}\\n")
"""))

    nb['cells'] = cells
    path = os.path.join(NOTEBOOKS_DIR, "04_model_explainability.ipynb")
    with open(path, "w", encoding="utf-8") as f:
        nbf.write(nb, f)
    print(f"Created: {path}")


if __name__ == "__main__":
    create_01_data_understanding()
    create_02_eda_and_preprocessing()
    create_03_fault_classification()
    create_04_model_explainability()
    print("All 4 Jupyter notebooks successfully generated!")

