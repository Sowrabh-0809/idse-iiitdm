"""
src/predict.py
Standalone inference module for VLSI Fault Diagnosis and Mitigation Recommendation.
Loads saved production pipelines and provides single-sample and batch prediction APIs.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Union, List

from data_loader import FAULT_CLASS_MAP, BASE_NUMERICAL_FEATURES, CATEGORICAL_FEATURES

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")


class VLSIPredictor:
    """Production inference engine for VLSI fault diagnosis."""

    def __init__(self, model_dir: str = None):
        if model_dir is None:
            model_dir = os.path.abspath(MODEL_DIR)
            
        self.model_dir = model_dir
        self.fe = joblib.load(os.path.join(self.model_dir, "feature_engineer.joblib"))
        self.preprocessor = joblib.load(os.path.join(self.model_dir, "preprocessor.joblib"))
        self.fault_model = joblib.load(os.path.join(self.model_dir, "best_model.joblib"))
        
        # Load mitigation model if available
        mit_path = os.path.join(self.model_dir, "best_mitigation_model.joblib")
        le_path = os.path.join(self.model_dir, "mitigation_label_encoder.joblib")
        if os.path.exists(mit_path) and os.path.exists(le_path):
            self.mit_model = joblib.load(mit_path)
            self.mit_le = joblib.load(le_path)
        else:
            self.mit_model = None
            self.mit_le = None
            
        with open(os.path.join(self.model_dir, "feature_names.json"), "r") as f:
            self.feature_names = json.load(f)

    def predict(self, input_data: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
        """
        Predicts fault class, probabilities, mitigation action, and top contributing parameters.
        """
        if isinstance(input_data, dict):
            df_in = pd.DataFrame([input_data])
        else:
            df_in = input_data.copy()
            
        # 1. Feature Engineering
        df_eng = self.fe.transform(df_in)
        
        # 2. Preprocessing
        X_trans = self.preprocessor.transform(df_eng)
        
        # 3. Fault Prediction
        pred_class_idx = int(self.fault_model.predict(X_trans)[0])
        pred_class_name = FAULT_CLASS_MAP.get(pred_class_idx, f"Class {pred_class_idx}")
        
        # Probabilities
        if hasattr(self.fault_model, "predict_proba"):
            probs = self.fault_model.predict_proba(X_trans)[0]
            prob_dict = {FAULT_CLASS_MAP[i]: float(probs[i]) for i in range(len(probs))}
        else:
            prob_dict = {pred_class_name: 1.0}
            
        # 4. Mitigation Recommendation
        if self.mit_model is not None:
            mit_idx = int(self.mit_model.predict(X_trans)[0])
            mit_action = self.mit_le.inverse_transform([mit_idx])[0]
        else:
            mit_action = "Mitigation model unavailable."
            
        # 5. Top Contributing Features (using relative feature deviations from nominal)
        # Identify features with highest absolute standardized z-score in this sample
        abs_scores = np.abs(X_trans[0])
        top_indices = np.argsort(abs_scores)[-5:][::-1]
        top_factors = [
            {
                "feature": self.feature_names[idx],
                "standardized_deviation": float(X_trans[0][idx]),
                "impact": "High Positive Stress" if X_trans[0][idx] > 0 else "Low Negative Margin"
            }
            for idx in top_indices
        ]
        
        result = {
            "predicted_fault_code": pred_class_idx,
            "predicted_fault": pred_class_name,
            "confidence": float(max(prob_dict.values())),
            "probabilities": prob_dict,
            "recommended_mitigation": mit_action,
            "top_contributing_parameters": top_factors
        }
        return result


def get_demo_samples() -> Dict[str, Dict[str, Any]]:
    """Returns representative operational profiles for testing."""
    return {
        "Nominal Profile (No Fault)": {
            "voltage": 1.00,
            "frequency": 2.50,
            "switching_activity": 0.40,
            "load_capacitance": 0.50,
            "tech_node": "14nm",
            "process_variation": 0.00,
            "aging_factor": 0.15,
            "ambient_temp": 30.0,
            "workload": 0.45,
            "cooling_efficiency": 0.88,
            "noise_margin": 0.33,
            "total_power": 38.0,
            "junction_temperature": 48.0,
            "signal_delay": 10.7,
            "si_margin": 0.29,
            "electromigration_risk": 0.25,
            "soft_error_rate": 0.00040,
            "mttf": 660000.0
        },
        "High Thermal Stress (Thermal Fault)": {
            "voltage": 1.10,
            "frequency": 3.00,
            "switching_activity": 0.75,
            "load_capacitance": 0.75,
            "tech_node": "14nm",
            "process_variation": 0.00,
            "aging_factor": 0.75,
            "ambient_temp": 40.0,
            "workload": 0.85,
            "cooling_efficiency": 0.60,
            "noise_margin": 0.20,
            "total_power": 90.0,
            "junction_temperature": 115.0,
            "signal_delay": 16.0,
            "si_margin": 0.10,
            "electromigration_risk": 1.20,
            "soft_error_rate": 0.00068,
            "mttf": 115000.0
        },
        "Low Voltage High Delay (Timing Fault)": {
            "voltage": 0.89,
            "frequency": 2.75,
            "switching_activity": 0.60,
            "load_capacitance": 0.75,
            "tech_node": "28nm",
            "process_variation": 0.05,
            "aging_factor": 0.65,
            "ambient_temp": 35.0,
            "workload": 0.70,
            "cooling_efficiency": 0.70,
            "noise_margin": 0.25,
            "total_power": 58.0,
            "junction_temperature": 75.0,
            "signal_delay": 16.5,
            "si_margin": 0.17,
            "electromigration_risk": 0.89,
            "soft_error_rate": 0.00066,
            "mttf": 145000.0
        },
        "Overvoltage High Switching (Power Fault)": {
            "voltage": 1.15,
            "frequency": 3.05,
            "switching_activity": 0.82,
            "load_capacitance": 0.82,
            "tech_node": "45nm",
            "process_variation": 0.00,
            "aging_factor": 0.55,
            "ambient_temp": 35.0,
            "workload": 0.75,
            "cooling_efficiency": 0.70,
            "noise_margin": 0.25,
            "total_power": 97.0,
            "junction_temperature": 103.0,
            "signal_delay": 15.2,
            "si_margin": 0.13,
            "electromigration_risk": 1.24,
            "soft_error_rate": 0.00070,
            "mttf": 210000.0
        },
        "Degraded Eye Diagram (Signal Integrity Fault)": {
            "voltage": 1.00,
            "frequency": 2.75,
            "switching_activity": 0.70,
            "load_capacitance": 0.60,
            "tech_node": "7nm",
            "process_variation": 0.00,
            "aging_factor": 0.50,
            "ambient_temp": 30.0,
            "workload": 0.60,
            "cooling_efficiency": 0.80,
            "noise_margin": 0.10,
            "total_power": 70.0,
            "junction_temperature": 74.0,
            "signal_delay": 13.5,
            "si_margin": 0.015,
            "electromigration_risk": 0.74,
            "soft_error_rate": 0.00070,
            "mttf": 236000.0
        },
        "Wearout Aging Low MTTF (Reliability Fault)": {
            "voltage": 1.08,
            "frequency": 2.65,
            "switching_activity": 0.70,
            "load_capacitance": 0.70,
            "tech_node": "28nm",
            "process_variation": 0.04,
            "aging_factor": 0.85,
            "ambient_temp": 37.5,
            "workload": 0.75,
            "cooling_efficiency": 0.60,
            "noise_margin": 0.20,
            "total_power": 78.0,
            "junction_temperature": 99.0,
            "signal_delay": 16.2,
            "si_margin": 0.11,
            "electromigration_risk": 1.11,
            "soft_error_rate": 0.00065,
            "mttf": 77000.0
        }
    }


if __name__ == "__main__":
    predictor = VLSIPredictor()
    demos = get_demo_samples()
    print("=" * 70)
    print("VERIFYING INFERENCE PREDICTIONS ON CANONICAL OPERATIONAL PROFILES")
    print("=" * 70)
    for title, profile in demos.items():
        res = predictor.predict(profile)
        print(f"\n[Test Case] {title}:")
        print(f"  -> Predicted Fault : {res['predicted_fault']} (Confidence: {res['confidence']*100:.1f}%)")
        print(f"  -> Mitigation Action: {res['recommended_mitigation']}")
        print(f"  -> Top Contributors : {[f['feature'] for f in res['top_contributing_parameters'][:3]]}")

