# VLSI & Hardware: Multi-Class Fault Diagnosis and Mitigation Prediction Using Machine Learning

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Streamlit](https://img.shields.io/badge/Dashboard-Streamlit-FF4B4B.svg)](https://streamlit.io/)
[![XGBoost](https://img.shields.io/badge/ML%20Model-XGBoost-orange.svg)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/Explainability-SHAP-brightgreen.svg)](https://shap.readthedocs.io/)

A complete, end-to-end Classical Machine Learning project for diagnosing hardware faults in sub-micron VLSI integrated circuits and predicting automated mitigation actions. Designed for a college Data Science course capstone evaluation (10 Marks).

---

## 📌 Project Highlights
- **Primary Task**: 6-Class Fault Classification (*No Fault*, *Thermal Fault*, *Timing Fault*, *Power Fault*, *Signal Integrity Fault*, *Reliability Fault*).
- **Secondary Task**: Mitigation Action Prediction across 16 remediation strategies, with documented analysis of deterministic mappings.
- **Dataset**: 30,000 verified samples across 4 technology nodes (7nm, 14nm, 28nm, 45nm).
- **Champion Model**: XGBoost achieving **99.20% Test Accuracy** and **99.20% Macro F1-score** on held-out test data ($N=4,500$).
- **Explainable AI**: Global and local TreeExplainer SHAP feature attributions.
- **Strict Data Science Hygiene**: 70/15/15 stratified split, 5-fold cross-validation, zero data leakage, and physical outlier justification.
- **Interactive Web App**: Full-featured Streamlit dashboard with preset loaders and telemetry inputs.

---

## 📁 Repository Directory Structure

```
idse_project/
│
├── Data/
│   ├── vlsi_fault_detection.csv      # Verified dataset (30,000 samples, 38 columns)
│   └── README.md                     # Dataset documentation and Kaggle download instructions
│
├── notebooks/
│   ├── 01_data_understanding.ipynb   # Data inspection, summary stats, leakage discovery
│   ├── 02_eda_and_preprocessing.ipynb# EDA plots, outlier analysis, feature engineering
│   ├── 03_fault_classification.ipynb # Multi-model training, benchmarks, error analysis
│   └── 04_model_explainability.ipynb # SHAP global/local attributions & interpretations
│
├── src/
│   ├── data_loader.py                # Dataset loader, schema validator, leak-free splitter
│   ├── preprocessing.py              # Domain feature engineering & ColumnTransformer
│   ├── eda_visualizer.py             # Generates all 8 publication-grade EDA figures
│   ├── train.py                      # 5-fold CV & model training (Dummy, LR, RF, XGB)
│   ├── evaluate.py                   # Held-out test evaluation, confusion matrices, error analysis
│   ├── explainability.py             # TreeExplainer SHAP analysis & attribution figures
│   ├── mitigation.py                 # Secondary mitigation action classification pipeline
│   └── predict.py                    # Production inference API with canonical demo profiles
│
├── models/
│   ├── best_model.joblib             # Champion XGBoost classifier (Macro F1: 99.20%)
│   ├── preprocessor.joblib           # Fitted StandardScaler & OneHotEncoder
│   ├── feature_engineer.joblib       # Fitted VLSIFeatureEngineer
│   ├── random_forest.joblib          # Fitted Random Forest model
│   ├── logistic_regression.joblib    # Fitted Logistic Regression model
│   ├── dummy_classifier.joblib       # Fitted baseline model
│   ├── best_mitigation_model.joblib  # Fitted mitigation prediction model
│   ├── mitigation_label_encoder.joblib # Label encoder for 16 mitigation classes
│   └── feature_names.json            # Processed feature names list
│
├── reports/
│   ├── PROJECT_REPORT.md             # Complete academic capstone report (all 18 sections + viva)
│   ├── model_comparison_table.csv    # Final benchmark metrics on test set
│   ├── per_class_metrics.csv         # Per-class precision, recall, F1, and support
│   ├── confused_fault_pairs.csv      # Detailed misclassification analysis
│   ├── shap_feature_importance.csv   # Global SHAP feature ranking
│   └── figures/                      # 12 High-resolution generated diagnostic plots
│       ├── fault_class_distribution.png
│       ├── numerical_feature_distributions.png
│       ├── boxplots_electrical_parameters.png
│       ├── correlation_heatmap.png
│       ├── pairplot_important_features.png
│       ├── junction_temp_vs_fault_class.png
│       ├── voltage_vs_frequency.png
│       ├── feature_comparison_across_faults.png
│       ├── all_models_confusion_matrices.png
│       ├── model_performance_comparison.png
│       ├── error_analysis_misclassifications.png
│       ├── shap_feature_importance_bar.png
│       ├── shap_summary_plot.png
│       ├── shap_individual_sample_explanations.png
│       └── mitigation_confusion_matrix.png
│
├── app.py                            # Interactive Streamlit Web Dashboard
├── requirements.txt                  # Python dependencies
├── README.md                         # Project documentation and guide
└── .gitignore                        # Git ignore file
```

---

## 🚀 Quickstart Guide (Windows PowerShell)

### Step 1: Open Windows PowerShell and Navigate to the Directory
```powershell
cd C:\Users\Akhil\Desktop\IDSE\Idse_Project
```

### Step 2: Verify Python Environment
```powershell
python --version
# Expected: Python 3.12+ (e.g., Python 3.13)
```

### Step 3: Install Required Dependencies
```powershell
python -m pip install -r requirements.txt
```

### Step 4: Run the Complete Pipeline End-to-End

```powershell
# 1. Run Data Loader and Validation
python src/data_loader.py

# 2. Generate all 8 EDA Visualizations
python src/eda_visualizer.py

# 3. Train Baseline & Machine Learning Models (with 5-Fold Stratified CV)
python src/train.py

# 4. Evaluate Models on Held-Out Test Set (N=4,500) & Run Error Analysis
python src/evaluate.py

# 5. Compute Explainable AI (SHAP) Attributions
python src/explainability.py

# 6. Train Secondary Mitigation Action Prediction Pipeline
python src/mitigation.py

# 7. Test Single-Sample / Batch Inference Engine
python src/predict.py
```

### Step 5: Launch the Streamlit Interactive Dashboard
```powershell
python -m streamlit run app.py
```
*The web browser will open automatically at `http://localhost:8501`.*

---

## 📊 Benchmark Model Performance on Test Set ($N=4,500$)

| Model Architecture | Accuracy | Macro Precision | Macro Recall | **Macro F1-Score** | Weighted F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dummy Baseline** | 16.67% | 0.0278 | 0.1667 | **0.0476** | 0.0476 |
| **Logistic Regression** | 98.07% | 0.9807 | 0.9807 | **0.9807** | 0.9807 |
| **Random Forest** | 99.02% | 0.9903 | 0.9902 | **0.9902** | 0.9902 |
| **XGBoost (Champion)** | **99.20%** | **0.9920** | **0.9920** | **0.9920** | **0.9920** |

### Per-Class Metrics (XGBoost):
- **No Fault**: Precision 1.0000 | Recall 1.0000 | F1 1.0000 (750 samples)
- **Thermal Fault**: Precision 0.9723 | Recall 0.9813 | F1 0.9768 (750 samples)
- **Timing Fault**: Precision 1.0000 | Recall 1.0000 | F1 1.0000 (750 samples)
- **Power Fault**: Precision 0.9933 | Recall 0.9947 | F1 0.9940 (750 samples)
- **Signal Integrity Fault**: Precision 1.0000 | Recall 1.0000 | F1 1.0000 (750 samples)
- **Reliability Fault**: Precision 0.9865 | Recall 0.9760 | F1 0.9812 (750 samples)

---

## 🔍 In-Depth Error Analysis Summary
Out of 4,500 test samples, the model committed only **36 misclassifications (0.80% error rate)**:
- **Reliability Fault $\leftrightarrow$ Thermal Fault (27 errors)**: Both faults exhibit extreme junction temperatures ($T_j > 95^\circ\text{C}$) and accelerated electromigration wearout, creating boundary overlap near degradation thresholds.
- **Power Fault $\leftrightarrow$ Thermal Fault (8 errors)**: High dynamic power directly converts into heat dissipation; fluctuations in cooling efficiency blur the line between excessive power and thermal throttling.
- **Timing & Signal Integrity Faults (0 errors)**: Both achieved 100% precision and recall due to unmistakable orthogonal physical signatures (undervoltage and collapsed eye-diagram margins).

---

## 🎓 Academic Defense & Faculty Viva Highlights
See the full report in [`reports/PROJECT_REPORT.md`](reports/PROJECT_REPORT.md) for complete answers to the **15 likely viva questions**, including:
1. Mathematical justification for choosing **Macro F1-score**.
2. Detailed explanation of **data leakage prevention**.
3. Physical rationale for **retaining extreme outliers**.
4. Explanation of **SHAP Shapley values** vs. traditional Gini importance.
5. The critical discovery regarding the **deterministic mapping of mitigation labels**.

---

## 📜 License
This project is released under the MIT License. Developed for academic evaluation.

