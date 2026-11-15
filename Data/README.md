# Dataset Documentation: VLSI & Hardware Fault Detection Dataset

## 1. Overview
This dataset contains simulated and measured electrical, thermal, and operational metrics from sub-micron VLSI circuits across four major CMOS technology nodes (7nm, 14nm, 28nm, and 45nm). The goal is to accurately classify circuit operating conditions into six distinct fault categories and determine appropriate physical/architectural mitigation actions.

- **Primary Source**: Kaggle - VLSI Fault Detection Dataset
- **File Name**: `vlsi_fault_detection.csv`
- **Expected Location**: `Data/vlsi_fault_detection.csv` (or `data/vlsi_fault_detection.csv`)
- **Total Records**: 30,000 samples
- **Total Columns**: 38 columns (18 primary physical operational parameters, 1 tech node categorical column, 1 primary target column `fault_type`, 1 severity level column `severity`, 1 secondary target column `mitigation_action`, and 17 one-hot/label-encoded pre-baked target columns).

## 2. Target Classes (Multi-Class Fault Diagnosis)
The primary target variable is `fault_type`, encoded as integers 0 through 5:
- **0 - No Fault**: Circuit operates within nominal voltage, temperature, and timing margins. (5,000 samples, 16.67%)
- **1 - Thermal Fault**: Characterized by elevated junction temperature ($T_j > 105^\circ\text{C}$), high ambient temperatures, high workload, and reduced cooling efficiency. (5,000 samples, 16.67%)
- **2 - Timing Fault**: Characterized by propagation delay spikes caused by low supply voltage, large load capacitance, and process variation, leading to setup/hold violations. (5,000 samples, 16.67%)
- **3 - Power Fault**: Characterized by excessive dynamic and leakage power dissipation resulting from high supply voltage, high operating frequency, and elevated switching activity. (5,000 samples, 16.67%)
- **4 - Signal Integrity Fault**: Characterized by degraded noise margins, crosstalk, and collapsed eye-diagram margins (`si_margin` approaching 0 or negative). (5,000 samples, 16.67%)
- **5 - Reliability Fault**: Characterized by physical degradation over operational lifetime, high aging factor, electromigration risks, and drastically reduced Mean Time To Failure (MTTF). (5,000 samples, 16.67%)

## 3. Secondary Task: Mitigation Actions
The dataset includes `mitigation_action` comprising 16 unique remediation protocols (e.g., *DVFS*, *Clock Gating*, *Buffer Insertion*, *Rerouting*, *Driver Sizing*, *Shielding*, *Redundancy*, *Wire Widening + ECC*).
**Data Science Finding on Mitigation Labels:**
Cross-tabulation reveals that each mitigation action is **strictly and deterministically determined** by the combination of `(fault_type, severity)`. Therefore, treating mitigation prediction as an unconstrained independent classification without addressing this relationship is misleading. To prevent target leakage, all `action_*` dummy columns, `severity`, and `mitigation_action` MUST BE EXCLUDED from the feature matrix used for diagnosing `fault_type`.

## 4. How to Download the Dataset from Kaggle (If missing)
1. Install Kaggle CLI: `pip install kaggle`
2. Configure your Kaggle API key (`~/.kaggle/kaggle.json`).
3. Download the dataset:
   ```powershell
   kaggle datasets download -d <dataset-owner>/vlsi-fault-detection -p Data/ --unzip
   ```
4. Verify that `Data/vlsi_fault_detection.csv` exists and contains 30,000 rows.

