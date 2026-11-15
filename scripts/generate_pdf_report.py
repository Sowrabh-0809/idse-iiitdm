"""
scripts/generate_pdf_report.py
Generates a comprehensive, publication-grade academic PDF report matching the exact
style, section flow, typography, tables, code snippets, and visual presentation of report.pdf.
Neglects the handwritten assignment section and focuses 100% on the Course Project.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Output Paths
ROOT_PDF = "VLSI_Fault_Diagnosis_Project_Report.pdf"
REPORTS_PDF = os.path.join("reports", "VLSI_Fault_Diagnosis_Project_Report.pdf")
FIGURES_DIR = os.path.join("reports", "figures")


class NumberedCanvas(canvas.Canvas):
    """Canvas that adds clean running headers and page numbers."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress running header/footer on title page
            
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4B5563"))
        
        # Header
        self.drawString(54, 11 * inch - 36, "Introduction to Data Science — Course Project Report: VLSI Fault Diagnosis")
        self.setStrokeColor(colors.HexColor("#D1D5DB"))
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
        
        # Footer
        self.line(54, 45, 8.5 * inch - 54, 45)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 32, page_str)
        self.drawString(54, 32, "Confidential — Evaluated for College Data Science Capstone (10 Marks)")
        self.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        ROOT_PDF,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography Styles matching report.pdf
    c_primary = colors.HexColor("#1E3A8A")   # Deep Navy
    c_secondary = colors.HexColor("#2563EB") # Blue
    c_dark = colors.HexColor("#1F2937")      # Charcoal
    c_bg_code = colors.HexColor("#F3F4F6")   # Code block background
    
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=c_primary,
        alignment=0,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#4B5563"),
        alignment=0,
        spaceAfter=30
    )
    
    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=c_dark,
        spaceAfter=7
    )
    
    bullet_style = ParagraphStyle(
        "ReportBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=c_dark,
        leftIndent=15,
        spaceAfter=4
    )
    
    code_style = ParagraphStyle(
        "ReportCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#111827"),
        backColor=c_bg_code,
        borderColor=colors.HexColor("#E5E7EB"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=5,
        spaceAfter=7
    )
    
    result_style = ParagraphStyle(
        "ReportResult",
        parent=styles["Normal"],
        fontName="Courier-Bold",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#065F46"),
        backColor=colors.HexColor("#ECFDF5"),
        borderColor=colors.HexColor("#A7F3D0"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=8
    )

    story = []
    
    # -------------------------------------------------------------------------
    # PAGE 1: TITLE / COVER PAGE (Matches report.pdf page 1 style)
    # -------------------------------------------------------------------------
    story.append(Spacer(1, 40))
    story.append(Paragraph("Introduction to Data Science", ParagraphStyle("CourseName", fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=c_secondary, spaceAfter=8)))
    story.append(Paragraph("Project Report:", ParagraphStyle("ReportLabel", fontName="Helvetica", fontSize=12, leading=16, textColor=colors.HexColor("#6B7280"), spaceAfter=15)))
    story.append(Paragraph("Faulty Semiconductor & VLSI Fault Diagnosis", title_style))
    story.append(HRFlowable(width="100%", thickness=3, color=c_secondary, spaceAfter=20, spaceBefore=0))
    story.append(Paragraph("Multi-Class Hardware Fault Diagnosis and Automated Mitigation Prediction Using Multi-Sensor Physical Telemetry and Classical Machine Learning", subtitle_style))
    
    story.append(Spacer(1, 100))
    story.append(Paragraph("TEAM MEMBERS / STUDENT DETAILS:", ParagraphStyle("TeamLabel", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=c_primary, spaceAfter=10)))
    team_table_data = [
        [Paragraph("<b>Candidate Name</b>", body_style), Paragraph("<b>Roll Number / ID</b>", body_style), Paragraph("<b>Department / Program</b>", body_style)],
        [Paragraph("Data Science Project Team", body_style), Paragraph("VLSI-DS-2026", body_style), Paragraph("Electronics & Communication / Data Science", body_style)]
    ]
    t_team = Table(team_table_data, colWidths=[2.5*inch, 2.0*inch, 2.5*inch])
    t_team.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#BFDBFE")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_team)
    
    story.append(Spacer(1, 40))
    eval_note = Paragraph("<b>Course Evaluation:</b> Capstone Project Submission (Weightage: 10 Marks)<br/><b>Focus:</b> Methodological Correctness, Data Leakage Prevention, Physical Interpretability, and Reproducibility.", body_style)
    story.append(eval_note)
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # PAGE 2: PROBLEM STATEMENT & DOMAIN CONTEXT (Matches report.pdf page 2)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Fault Detection in Semiconductor Manufacturing Using Multi-Sensor VLSI Parameter Data and Machine Learning", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    
    story.append(Paragraph("Problem Statement:", h2_style))
    story.append(Paragraph(
        "Semiconductor fabrication and post-silicon validation involve ultra-precision monitoring of integrated circuit (IC) "
        "and MOSFET parameters. During wafer testing and field operation, multi-channel electrical and environmental telemetry "
        "continuously record voltage, frequency, thermal dissipation, signal propagation delays, and noise margins. "
        "In modern Deep Sub-Micron (DSM) technology nodes (7nm, 14nm, 28nm, and 45nm), process variations, thermal hot-spots, "
        "and device aging degrade circuit reliability, leading to functional failures.", body_style
    ))
    story.append(Paragraph(
        "The verified VLSI Fault Detection dataset contains 30,000 multi-physics samples capturing operational conditions across "
        "four technology nodes. These operational sensor channels capture numerous physical device behaviors, including:", body_style
    ))
    
    story.append(Paragraph("• <b>Short-Channel Effects (SCE) & Voltage Starvation:</b> Threshold voltage roll-off, Drain-Induced Barrier Lowering (DIBL), sub-threshold slope degradation, supply rail voltage droop, and gate switching activity variations.", bullet_style))
    story.append(Paragraph("• <b>Thermal & Heat Dissipation Channels:</b> Silicon junction temperature ($T_j$), ambient temperature ($T_a$), workload utilization factors, and heat sink cooling efficiency metrics.", bullet_style))
    story.append(Paragraph("• <b>Timing & Critical Path Delays:</b> Signal propagation delay across combinational logic, setup/hold timing margin degradation, and parasitic load capacitance ($C_L$) charging kinetics.", bullet_style))
    story.append(Paragraph("• <b>Signal Integrity & Noise Margin Sensors:</b> High and low logic noise margins ($V_{NH}, V_{NL}$), inductive ground bounce, inter-wire capacitive crosstalk, and eye-diagram opening margins (`si_margin`).", bullet_style))
    story.append(Paragraph("• <b>Reliability, Aging & Wearout Indicators:</b> Silicon aging factors driven by Bias Temperature Instability (BTI), Hot Carrier Injection (HCI), interconnect electromigration (EM) risk ratios, soft error rates, and Mean Time To Failure (MTTF).", bullet_style))
    
    story.append(Paragraph(
        "These sensor readings collectively characterize the electrical integrity, geometric accuracy, and reliability behavior of VLSI chips. "
        "The primary goal is to accurately classify circuit operating conditions into <b>six mutually exclusive fault categories</b>: "
        "<i>No Fault (Nominal)</i>, <i>Thermal Fault</i>, <i>Timing Fault</i>, <i>Power Fault</i>, <i>Signal Integrity Fault</i>, and <i>Reliability Fault</i>, "
        "and recommend actionable circuit remediations without data leakage.", body_style
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 1: DATA CLEANING & PHYSICAL OUTLIER ANALYSIS (Matches report.pdf page 3-4)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Step 1: Data Understanding & Data Cleaning", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph(
        "The dataset used in this project contained 30,000 samples and 38 columns, encompassing physical sensor measurements (features) "
        "and hardware fault labels. To guarantee data reliability, the following data cleaning and auditing strategy was applied:", body_style
    ))
    
    story.append(Paragraph("Missing Value Handling & Duplicate Records:", h2_style))
    story.append(Paragraph(
        "An automated audit of the dataset confirmed <b>zero missing values (NaN)</b> across all 38 columns and <b>zero duplicate rows</b>. "
        "Unlike datasets requiring heavy imputation, the verified dataset has high measurement completeness. Automated median and standard imputation "
        "fallbacks were integrated into the preprocessing pipeline for runtime robustness.", body_style
    ))
    
    story.append(Paragraph("Physical Outlier Justification (Crucial Data Science Principle):", h2_style))
    story.append(Paragraph(
        "Standard statistical outlier detection using the Interquartile Range rule ($1.5 \times \text{IQR}$) flagged extreme values in "
        "`junction_temperature` (>105°C), `total_power` (>90W), and `si_margin` (<0).<br/>"
        "<b>Rigorous Methodological Decision:</b> These measurements were <b>deliberately retained</b>. In semiconductor engineering, an extreme "
        "junction temperature (115°C) or negative SI margin is not an instrument error—it is the <i>exact physical signature</i> of Thermal and Signal Integrity faults. "
        "Blindly removing statistical outliers would destroy the ground-truth signals needed for fault diagnosis.", body_style
    ))
    
    story.append(Paragraph("Code for Data Loading & Integrity Verification:", h2_style))
    code_s1 = (
        "import pandas as pd\n"
        "df = pd.read_csv('Data/vlsi_fault_detection.csv')\n"
        "print('Dataset Dimensions :', df.shape)          # (30000, 38)\n"
        "print('Missing Values     :', df.isnull().sum().sum()) # 0\n"
        "print('Duplicate Records  :', df.duplicated().sum())   # 0\n"
        "print('Fault Distribution :\\n', df['fault_type'].value_counts().sort_index())"
    )
    story.append(Paragraph(code_s1.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
    
    res_s1 = (
        "Result:\n"
        "Dataset Dimensions : (30000, 38)\n"
        "Missing Values     : 0 (100% completeness)\n"
        "Duplicate Records  : 0\n"
        "Fault Distribution : Exactly 5,000 samples per class across all 6 classes (16.67% each; perfectly balanced)"
    )
    story.append(Paragraph(res_s1.replace("\n", "<br/>").replace(" ", "&nbsp;"), result_style))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 2: DATA PREPROCESSING & TARGET LEAKAGE PREVENTION (Matches report.pdf page 5-7)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Step 2: Data Preprocessing & Target Leakage Prevention", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    
    story.append(Paragraph("Target Leakage Isolation (Critical Rigor):", h2_style))
    story.append(Paragraph(
        "Inspection of the raw dataset identified several columns that represent target variables or pre-baked target information: "
        "`fault_type` (primary target), `severity` (severity level), `mitigation_action` (secondary target), and 16 one-hot dummy columns "
        "(`action_Buffer Insertion`, ..., `action_Wire Widening + ECC`).<br/>"
        "Including any `action_*` dummy column or `severity` in the feature matrix for diagnosing faults represents <b>severe data leakage</b>. "
        "All leakage columns were strictly isolated. Only the 18 physical operational measurements and technology nodes were utilized as inputs.", body_style
    ))
    
    story.append(Paragraph("Stratified Train-Validation-Test Splitting:", h2_style))
    story.append(Paragraph(
        "The dataset was split using stratified sampling into: <b>70% Training (21,000 samples)</b>, <b>15% Validation (4,500 samples)</b>, "
        "and <b>15% Held-Out Testing (4,500 samples)</b>. The test set was strictly held out and untouched until final evaluation.", body_style
    ))
    
    story.append(Paragraph("Domain-Driven Feature Engineering (7 Derived Physical Features):", h2_style))
    story.append(Paragraph(
        "To provide classical machine learning models with rich physical interaction signals, seven derived features were engineered:<br/>"
        "1. <b>Dynamic Power Stress Proxy ($V^2 \cdot f$)</b>: Scaling indicator for dynamic power.<br/>"
        "2. <b>Timing Margin Slack Ratio ($V / f$)</b>: Quantifies voltage starvation relative to frequency.<br/>"
        "3. <b>Thermal Gradient ($\Delta T = T_j - T_a$)</b>: Core temperature rise above ambient.<br/>"
        "4. <b>Thermal Resistance Proxy ($\theta_{ja} = \Delta T / P_{\text{total}}$)</b>: Package dissipation capacity.<br/>"
        "5. <b>Dynamic Switching Stress ($\alpha \cdot C_L \cdot V^2 \cdot f$)</b>: Activity-weighted dynamic power.<br/>"
        "6. <b>Signal Integrity Health Ratio ($\text{SI Margin} / \text{Noise Margin}$)</b>: Ratio of eye margin to noise tolerance.<br/>"
        "7. <b>Aging-Thermal Compound Stress ($\text{Aging Factor} \times T_j / 100$)</b>: Temperature-accelerated physical wearout.", body_style
    ))
    
    story.append(Paragraph("Standardization & One-Hot Encoding:", h2_style))
    story.append(Paragraph(
        "A Scikit-Learn `ColumnTransformer` was fit <b>exclusively on the training split</b>: `StandardScaler` scaled all 24 numerical features, "
        "and `OneHotEncoder` encoded the 4 technology nodes (`7nm`, `14nm`, `28nm`, `45nm`), expanding the clean feature matrix to 28 columns.", body_style
    ))
    
    code_s2 = (
        "from sklearn.model_selection import train_test_split\n"
        "from sklearn.preprocessing import StandardScaler, OneHotEncoder\n"
        "# Split: 70% Train, 15% Val, 15% Test (Stratified)\n"
        "X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=42)\n"
        "X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42)\n"
        "# Feature Engineering and Preprocessing Pipeline fit strictly on Train\n"
        "preprocessor = ColumnTransformer(transformers=[\n"
        "    ('num', StandardScaler(), numerical_cols),\n"
        "    ('cat', OneHotEncoder(sparse_output=False), ['tech_node'])\n"
        "])\n"
        "X_train_trans = preprocessor.fit_transform(X_train_eng)"
    )
    story.append(Paragraph(code_s2.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 3: MODEL BUILDING & 5-FOLD CV (Matches report.pdf page 8-9)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Step 3: Machine Learning Model Building & Cross-Validation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph(
        "Four machine learning architectures were trained and compared. To prevent data leakage, <b>5-Fold Stratified Cross-Validation</b> "
        "was executed strictly within the 21,000-sample training set before evaluating on the held-out validation and test sets.", body_style
    ))
    
    story.append(Paragraph("MODEL 1: Dummy Classifier (Theoretical Baseline)", h2_style))
    story.append(Paragraph("Establishes a random guessing baseline ($1/6 \approx 16.67\%$ accuracy, Macro F1 $\approx 0.0476$). Crucial to confirm that trained models learn real physical boundaries rather than class balance heuristics.", bullet_style))
    
    story.append(Paragraph("MODEL 2: Multinomial Logistic Regression", h2_style))
    story.append(Paragraph("Fast, interpretable linear benchmark utilizing standardized features and L-BFGS optimization. Achieved 98.36% (±0.24%) CV accuracy, demonstrating high linear separability for extreme electrical conditions.", bullet_style))
    
    story.append(Paragraph("MODEL 3: Random Forest Classifier (Bagging Ensemble)", h2_style))
    story.append(Paragraph("Non-linear ensemble of 100 decision trees (max depth 16, min samples split 5). Effectively captures electro-thermal interactions without overfitting, reaching 99.20% (±0.16%) CV accuracy.", bullet_style))
    
    story.append(Paragraph("MODEL 4: XGBoost Classifier (Champion Model)", h2_style))
    story.append(Paragraph("Gradient Boosted Decision Trees (100 estimators, max depth 6, learning rate 0.1, multi-class log-loss). Achieved the highest 5-fold CV performance at 99.27% (±0.11%) accuracy and 0.9927 Macro F1.", bullet_style))
    
    code_s3 = (
        "from sklearn.model_selection import StratifiedKFold, cross_validate\n"
        "cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)\n"
        "models = {\n"
        "    'Dummy': DummyClassifier(strategy='most_frequent'),\n"
        "    'Logistic Regression': LogisticRegression(max_iter=1000, solver='lbfgs', random_state=42),\n"
        "    'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42),\n"
        "    'XGBoost': XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)\n"
        "}\n"
        "for name, model in models.items():\n"
        "    scores = cross_validate(model, X_train_trans, y_train, cv=cv, scoring='f1_macro')\n"
        "    print(f'{name} CV Macro F1: {scores[\"test_score\"].mean():.4f}')"
    )
    story.append(Paragraph(code_s3.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
    
    res_s3 = (
        "5-Fold Stratified Cross-Validation Results (Train Split N=21,000):\n"
        "  Dummy Classifier     | CV Accuracy: 16.67% (±0.00%) | CV Macro F1: 0.0476\n"
        "  Logistic Regression  | CV Accuracy: 98.36% (±0.24%) | CV Macro F1: 0.9836\n"
        "  Random Forest        | CV Accuracy: 99.20% (±0.16%) | CV Macro F1: 0.9920\n"
        "  XGBoost              | CV Accuracy: 99.27% (±0.11%) | CV Macro F1: 0.9927"
    )
    story.append(Paragraph(res_s3.replace("\n", "<br/>").replace(" ", "&nbsp;"), result_style))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 4: MODEL COMPARISON & METRIC ANALYSIS (Matches report.pdf page 10-12)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Step 4: Model Comparison & Evaluation Metrics Analysis", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph(
        "To rigorously evaluate the multi-class fault classification performance, all fitted models were benchmarked on the "
        "<b>strictly held-out Test Set (N=4,500 samples)</b>. Macro F1-score was selected as the primary comparison metric.", body_style
    ))
    
    story.append(Paragraph("Final Benchmark Performance Table (Held-Out Test Set):", h2_style))
    comp_table_data = [
        [Paragraph("<b>Model Architecture</b>", body_style), Paragraph("<b>Accuracy</b>", body_style), Paragraph("<b>Macro Precision</b>", body_style), Paragraph("<b>Macro Recall</b>", body_style), Paragraph("<b>Macro F1</b>", body_style), Paragraph("<b>Weighted F1</b>", body_style)],
        [Paragraph("Dummy Baseline", body_style), Paragraph("16.67%", body_style), Paragraph("0.0278", body_style), Paragraph("0.1667", body_style), Paragraph("0.0476", body_style), Paragraph("0.0476", body_style)],
        [Paragraph("Logistic Regression", body_style), Paragraph("98.07%", body_style), Paragraph("0.9807", body_style), Paragraph("0.9807", body_style), Paragraph("0.9807", body_style), Paragraph("0.9807", body_style)],
        [Paragraph("Random Forest", body_style), Paragraph("99.02%", body_style), Paragraph("0.9903", body_style), Paragraph("0.9902", body_style), Paragraph("0.9902", body_style), Paragraph("0.9902", body_style)],
        [Paragraph("<b>XGBoost (Champion)</b>", body_style), Paragraph("<b>99.20%</b>", body_style), Paragraph("<b>0.9920</b>", body_style), Paragraph("<b>0.9920</b>", body_style), Paragraph("<b>0.9920</b>", body_style), Paragraph("<b>0.9920</b>", body_style)]
    ]
    t_comp = Table(comp_table_data, colWidths=[2.2*inch, 1.0*inch, 1.0*inch, 1.0*inch, 1.0*inch, 1.0*inch])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,4), (-1,4), colors.HexColor("#ECFDF5")),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Per-Class Metrics for Champion XGBoost Model:", h2_style))
    per_class_data = [
        [Paragraph("<b>Fault Category</b>", body_style), Paragraph("<b>Precision</b>", body_style), Paragraph("<b>Recall</b>", body_style), Paragraph("<b>F1-Score</b>", body_style), Paragraph("<b>Test Support</b>", body_style)],
        [Paragraph("No Fault (Nominal)", body_style), Paragraph("1.0000", body_style), Paragraph("1.0000", body_style), Paragraph("1.0000", body_style), Paragraph("750", body_style)],
        [Paragraph("Thermal Fault", body_style), Paragraph("0.9723", body_style), Paragraph("0.9813", body_style), Paragraph("0.9768", body_style), Paragraph("750", body_style)],
        [Paragraph("Timing Fault", body_style), Paragraph("1.0000", body_style), Paragraph("1.0000", body_style), Paragraph("1.0000", body_style), Paragraph("750", body_style)],
        [Paragraph("Power Fault", body_style), Paragraph("0.9933", body_style), Paragraph("0.9947", body_style), Paragraph("0.9940", body_style), Paragraph("750", body_style)],
        [Paragraph("Signal Integrity Fault", body_style), Paragraph("1.0000", body_style), Paragraph("1.0000", body_style), Paragraph("1.0000", body_style), Paragraph("750", body_style)],
        [Paragraph("Reliability Fault", body_style), Paragraph("0.9865", body_style), Paragraph("0.9760", body_style), Paragraph("0.9812", body_style), Paragraph("750", body_style)],
        [Paragraph("<b>Macro Average</b>", body_style), Paragraph("<b>0.9920</b>", body_style), Paragraph("<b>0.9920</b>", body_style), Paragraph("<b>0.9920</b>", body_style), Paragraph("<b>4,500</b>", body_style)]
    ]
    t_pc = Table(per_class_data, colWidths=[2.2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
    t_pc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F3F4F6")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#EFF6FF")),
    ]))
    story.append(t_pc)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Why Macro F1-Score is the Optimal Evaluation Standard:", h2_style))
    story.append(Paragraph(
        "Standard accuracy computes aggregate correctness and can be distorted if an algorithm fails on rare or critical failure modes. "
        "Macro F1 computes the unweighted harmonic mean of Precision and Recall for every class independently: "
        "$$\text{Macro F1} = \frac{1}{K}\sum_{k=1}^{K} \frac{2 \cdot P_k \cdot R_k}{P_k + R_k}$$ "
        "This guarantees that the model is evaluated with equal rigor across all six fault classes.", body_style
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 5: IN-DEPTH ERROR ANALYSIS (Matches report.pdf page 11-12)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Step 5: In-Depth Error Analysis & Boundary Ambiguity", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph(
        "Out of 4,500 held-out test samples, the champion XGBoost model committed only <b>36 misclassifications (0.80% overall error rate)</b>. "
        "A rigorous error audit was conducted to understand the physical mechanisms causing decision boundary ambiguity.", body_style
    ))
    
    story.append(Paragraph("Most Frequent Confused Fault Pairs:", h2_style))
    err_table_data = [
        [Paragraph("<b>True Fault Class</b>", body_style), Paragraph("<b>Predicted Fault Class</b>", body_style), Paragraph("<b>Error Count</b>", body_style), Paragraph("<b>Physical Root Cause Rationale</b>", body_style)],
        [Paragraph("Reliability Fault", body_style), Paragraph("Thermal Fault", body_style), Paragraph("17", body_style), Paragraph("Aging devices operating at high junction temperatures ($T_j > 95^\circ\text{C}$) mimic early thermal runaway.", body_style)],
        [Paragraph("Thermal Fault", body_style), Paragraph("Reliability Fault", body_style), Paragraph("10", body_style), Paragraph("Thermal throttling and hot-spots accelerate electromigration stress, causing overlapping wearout indicators.", body_style)],
        [Paragraph("Power Fault", body_style), Paragraph("Thermal Fault", body_style), Paragraph("4", body_style), Paragraph("Extreme dynamic power ($P \approx 98\text{W}$) directly drives high thermal gradients when cooling efficiency is moderate.", body_style)],
        [Paragraph("Thermal Fault", body_style), Paragraph("Power Fault", body_style), Paragraph("4", body_style), Paragraph("Severe thermal runaway induces elevated leakage power, shifting operating points near the Power Fault boundary.", body_style)],
        [Paragraph("Reliability Fault", body_style), Paragraph("Power Fault", body_style), Paragraph("1", body_style), Paragraph("Interconnect electromigration causing localized resistance spikes and localized power dissipation.", body_style)]
    ]
    t_err = Table(err_table_data, colWidths=[1.8*inch, 1.8*inch, 0.9*inch, 2.7*inch])
    t_err.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#FEF2F2")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#FCA5A5")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_err)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Key Physical Insights on Classification Accuracy:", h2_style))
    story.append(Paragraph(
        "• <b>Zero Errors for Timing & Signal Integrity:</b> Timing Faults and Signal Integrity Faults achieved <b>100% Precision and 100% Recall</b>. "
        "Timing faults are governed by low voltage ($V < 0.92\text{V}$) combined with large propagation delays ($>16\text{ps/ns}$), while Signal Integrity "
        "faults are uniquely identified by collapsed eye-diagram margins ($\text{SI Margin} \le 0$). These two classes occupy orthogonal physical regions.<br/>"
        "• <b>Electro-Thermal Boundary Overlap:</b> All 36 misclassifications occurred exclusively among Thermal, Reliability, and Power faults. "
        "In deep sub-micron physics, Joule heating directly couples power dissipation to die temperature ($T_j = T_a + P \cdot \theta_{ja}$), "
        "and elevated temperatures exponentially accelerate Arrhenius electromigration aging, creating legitimate physical overlap at extreme operational boundaries.", body_style
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 6: EXPLAINABLE AI (SHAP) (Matches report.pdf explainability flow)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Step 6: Explainable AI (SHAP Feature Attribution)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph(
        "In safety-critical hardware testing, black-box predictions are unacceptable. Explainable AI (XAI) was implemented using "
        "<b>TreeExplainer SHAP (SHapley Additive exPlanations)</b>, grounded in cooperative game theory.", body_style
    ))
    
    story.append(Paragraph("Top 10 Most Influential Diagnostic Features (Global SHAP Importance):", h2_style))
    shap_table_data = [
        [Paragraph("<b>Rank</b>", body_style), Paragraph("<b>Feature Name</b>", body_style), Paragraph("<b>Mean |SHAP| Value</b>", body_style), Paragraph("<b>Physical Operational Role</b>", body_style)],
        [Paragraph("1", body_style), Paragraph("voltage", body_style), Paragraph("0.9828", body_style), Paragraph("Primary control parameter governing dynamic power ($CV^2f$) and propagation slack.", body_style)],
        [Paragraph("2", body_style), Paragraph("noise_margin", body_style), Paragraph("0.7819", body_style), Paragraph("Direct indicator of logic threshold noise tolerance and eye closure.", body_style)],
        [Paragraph("3", body_style), Paragraph("aging_factor", body_style), Paragraph("0.6866", body_style), Paragraph("Quantifies physical wearout and threshold voltage drift ($\Delta V_{th}$) from BTI/HCI.", body_style)],
        [Paragraph("4", body_style), Paragraph("cooling_efficiency", body_style), Paragraph("0.2820", body_style), Paragraph("Determines package thermal dissipation capacity.", body_style)],
        [Paragraph("5", body_style), Paragraph("frequency", body_style), Paragraph("0.2702", body_style), Paragraph("Dictates cycle timing budget and dynamic switching frequency.", body_style)],
        [Paragraph("6", body_style), Paragraph("<b>aging_thermal_stress</b>", body_style), Paragraph("0.2605", body_style), Paragraph("<i>(Engineered)</i> Captures wearout acceleration under high junction heat.", body_style)],
        [Paragraph("7", body_style), Paragraph("ambient_temp", body_style), Paragraph("0.2441", body_style), Paragraph("Defines reference temperature for package heat transfer.", body_style)],
        [Paragraph("8", body_style), Paragraph("<b>v2_freq</b>", body_style), Paragraph("0.2271", body_style), Paragraph("<i>(Engineered)</i> Dynamic power scaling product.", body_style)],
        [Paragraph("9", body_style), Paragraph("<b>dynamic_switching_stress</b>", body_style), Paragraph("0.2037", body_style), Paragraph("<i>(Engineered)</i> Gate-level dynamic activity stress ($\alpha C V^2 f$).", body_style)],
        [Paragraph("10", body_style), Paragraph("mttf", body_style), Paragraph("0.1687", body_style), Paragraph("Empirical Mean Time To Failure indicator.", body_style)]
    ]
    t_shap = Table(shap_table_data, colWidths=[0.6*inch, 2.0*inch, 1.4*inch, 3.2*inch])
    t_shap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#BFDBFE")),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_shap)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Validation of Domain Feature Engineering:", h2_style))
    story.append(Paragraph(
        "Notice that three of our domain-engineered features—`aging_thermal_stress` (rank 6), `v2_freq` (rank 8), and "
        "`dynamic_switching_stress` (rank 9)—placed directly inside the top 10 most influential features across all classes. "
        "This confirms empirically that applying semiconductor physics to derive composite features substantially enhanced the model's diagnostic power.", body_style
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 7: SECONDARY TASK - MITIGATION PREDICTION (Matches report.pdf style)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Step 7: Secondary Task – Mitigation Action Prediction", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph(
        "The secondary project task is to predict the corresponding circuit-level mitigation action if valid mitigation labels exist.", body_style
    ))
    
    story.append(Paragraph("Critical Finding: Deterministic Mapping from (Fault Type, Severity):", h2_style))
    story.append(Paragraph(
        "Exhaustive cross-tabulation revealed that the 16 mitigation actions are <b>100% deterministically determined</b> by `(fault_type, severity)`:<br/>"
        "• <b>No Fault (Sev 0):</b> Normal Operation (5,000 samples)<br/>"
        "• <b>Thermal Fault:</b> Frequency Scaling (Sev 1), DVFS (Sev 2), DVFS + Clock Gating (Sev 3)<br/>"
        "• <b>Timing Fault:</b> Buffer Insertion (Sev 1), Rerouting (Sev 2), Rerouting + Pipeline (Sev 3)<br/>"
        "• <b>Power Fault:</b> Clock Gating (Sev 1), Power Gating (Sev 2), Power Gating + MTCMOS (Sev 3)<br/>"
        "• <b>Signal Integrity Fault:</b> Driver Sizing (Sev 1), Shielding (Sev 2), Shielding + Spacing (Sev 3)<br/>"
        "• <b>Reliability Fault:</b> Error Detection (Sev 1), Redundancy (Sev 2), Wire Widening + ECC (Sev 3)<br/>"
        "<i>Academic Honesty Note:</i> If both `fault_type` and `severity` were provided as inputs, predicting mitigation would be a trivial lookup. "
        "Presenting it as an unconstrained discovery without stating this would be methodologically flawed.", body_style
    ))
    
    story.append(Paragraph("Independent ML Mitigation Pipeline (Predicting from Raw Telemetry):", h2_style))
    story.append(Paragraph(
        "In operational test benches, `severity` is not directly measurable by sensors. We trained an independent machine learning model "
        "to predict the 16 mitigation actions <b>directly from raw operational telemetry</b>, strictly preventing target leakage.", body_style
    ))
    
    mit_table_data = [
        [Paragraph("<b>Model Architecture</b>", body_style), Paragraph("<b>Test Accuracy</b>", body_style), Paragraph("<b>Macro Precision</b>", body_style), Paragraph("<b>Macro Recall</b>", body_style), Paragraph("<b>Macro F1-Score</b>", body_style)],
        [Paragraph("Random Baseline (1/16 Chance)", body_style), Paragraph("6.25%", body_style), Paragraph("0.0625", body_style), Paragraph("0.0625", body_style), Paragraph("0.0625", body_style)],
        [Paragraph("Random Forest Mitigation Model", body_style), Paragraph("55.89%", body_style), Paragraph("0.3340", body_style), Paragraph("0.3015", body_style), Paragraph("0.2974", body_style)],
        [Paragraph("<b>XGBoost Mitigation Model</b>", body_style), Paragraph("<b>55.11%</b>", body_style), Paragraph("<b>0.3344</b>", body_style), Paragraph("<b>0.3204</b>", body_style), Paragraph("<b>0.3146</b>", body_style)]
    ]
    t_mit = Table(mit_table_data, colWidths=[2.6*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.1*inch])
    t_mit.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F5F3FF")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#DDD6FE")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_mit)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Performance Takeaway:</b> Predicting 16 fine-grained actions directly from continuous electrical measurements achieved <b>55.5% accuracy</b>, "
        "representing a <b>9x improvement over random chance</b>. The primary source of ambiguity is distinguishing between adjacent severity tiers "
        "(e.g., DVFS vs. DVFS + Clock Gating) rather than the underlying remediation protocol.", body_style
    ))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 8: FINAL CONCLUSION & WORKFLOW (Matches report.pdf page 17)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Final Conclusion & Data Science Workflow Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph(
        "This project successfully developed, evaluated, and deployed a classical Machine Learning system for VLSI hardware fault diagnosis. "
        "The project demonstrates the complete, end-to-end Data Science workflow:", body_style
    ))
    
    wf_box = (
        "Complete Data Science Project Lifecycle Executed:\n"
        "  1. Data Understanding   --> Verified 30,000 samples, schema audit, class balance, and leakage checks.\n"
        "  2. Data Cleaning        --> Zero missing values, zero duplicates, physically justified outlier retention.\n"
        "  3. Feature Engineering  --> Derived 7 physical features (V^2*f, Delta-T, thermal resistance, switching stress).\n"
        "  4. Preprocessing        --> Leak-free StandardScaler and OneHotEncoder fit strictly on 70% Train split.\n"
        "  5. Model Training       --> 5-Fold Stratified Cross-Validation on Train data (Dummy, LR, RF, XGBoost).\n"
        "  6. Evaluation           --> Held-out Test evaluation (N=4,500), achieving 99.20% Macro F1 with XGBoost.\n"
        "  7. Error Analysis       --> Diagnosed 36 errors, identifying physical electro-thermal boundary overlap.\n"
        "  8. Explainable AI       --> TreeExplainer SHAP global importance, class decomposition, and local rationale.\n"
        "  9. Mitigation Pipeline  --> Discovered deterministic mapping; trained independent model (9x over baseline).\n"
        "  10. Deployment          --> Interactive Streamlit web application for real-time telemetry testing."
    )
    story.append(Paragraph(wf_box.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("Local Web Dashboard & Code Repository:", h2_style))
    story.append(Paragraph("The complete, reproducible codebase and interactive Streamlit web dashboard are available locally:", body_style))
    story.append(Paragraph("• <b>Local Codebase Path:</b> <code>C:\\Users\\Akhil\\Desktop\\IDSE\\Idse_Project</code>", bullet_style))
    story.append(Paragraph("• <b>Interactive Dashboard Command:</b> <code>streamlit run app.py</code>", bullet_style))
    story.append(Paragraph("• <b>Jupyter Notebooks:</b> <code>notebooks/01_data_understanding.ipynb</code> through <code>04_model_explainability.ipynb</code>", bullet_style))
    story.append(PageBreak())

    # -------------------------------------------------------------------------
    # STEP 9: VISUALIZATIONS GALLERY (Matches report.pdf page 18-20)
    # -------------------------------------------------------------------------
    def add_figure_slide(fig_path, caption_title, description):
        elems = []
        elems.append(Paragraph(caption_title, h2_style))
        if os.path.exists(fig_path):
            elems.append(Image(fig_path, width=6.8*inch, height=3.8*inch))
        else:
            elems.append(Paragraph(f"<i>Figure file not found: {fig_path}</i>", body_style))
        elems.append(Spacer(1, 6))
        elems.append(Paragraph(f"<b>Physical Interpretation:</b> {description}", body_style))
        elems.append(PageBreak())
        return elems

    story.append(Paragraph("Visualizations Gallery: Exploratory & Diagnostic Plots", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph("This section documents the actual generated high-resolution visualizations supporting all project conclusions.", body_style))
    
    # 1. Fault class distribution
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "fault_class_distribution.png"),
        "Figure 1: Fault Class Distribution (Exact Balanced Dataset)",
        "The dataset features an exact, perfectly balanced distribution of 5,000 samples per fault class (16.67% each, total N=30,000). "
        "This eliminates majority-class bias and makes Macro F1-score and Accuracy directly comparable."
    ))
    
    # 2. Numerical distributions
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "numerical_feature_distributions.png"),
        "Figure 2: Numerical Distributions of Key Operational Parameters",
        "Shows distribution histograms with KDE curves. Parameters like voltage and frequency span discrete operational bands, "
        "while junction temperature spans nominal operating conditions (45°C) to extreme thermal throttling limits (120°C)."
    ))
    
    # 3. Boxplots across fault classes
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "boxplots_electrical_parameters.png"),
        "Figure 3: Critical Electrical Parameters Across Fault Classes",
        "Junction temperature is heavily elevated in Thermal Faults (~115°C) and Reliability Faults (~99°C). "
        "Total power approaches the 100W ceiling in Power Faults. Signal delay spikes in Timing Faults, "
        "and Signal Integrity Margin drops to near-zero/negative values exclusively in Signal Integrity Faults."
    ))
    
    # 4. Correlation heatmap
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "correlation_heatmap.png"),
        "Figure 4: Pearson Correlation Matrix of Operational Parameters",
        "Strong positive correlation between total_power and junction_temperature (r = 0.81), and between voltage and frequency. "
        "MTTF correlates negatively with aging_factor (r = -0.74) and junction temperature, reflecting accelerated physical wearout kinetics."
    ))
    
    # 5. Voltage vs Frequency
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "voltage_vs_frequency.png"),
        "Figure 5: Voltage vs. Frequency Operating Regimes",
        "Power faults cluster strictly in the high-voltage/high-frequency quadrant (>1.10V, >2.9 GHz). "
        "Timing faults populate the low-voltage regime (<0.92V), demonstrating orthogonal physical clustering."
    ))
    
    # 6. Standardized comparison
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "feature_comparison_across_faults.png"),
        "Figure 6: Standardized Z-Score Feature Deviations Across Classes",
        "Plots feature deviations from the global mean in standard deviations (Z-scores). Each fault exhibits a unique "
        "multi-dimensional electrical fingerprint: Signal Integrity is dominated by negative SI margin (Z = -1.2 sigma), "
        "Power Fault by high power (Z = +1.3 sigma), and Reliability by depleted MTTF (Z = -0.9 sigma)."
    ))
    
    # 7. Confusion matrices
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "all_models_confusion_matrices.png"),
        "Figure 7: Confusion Matrices on Held-Out Test Set (N=4,500)",
        "2x2 comparison grid for all evaluated models. Logistic Regression achieves 98.07% accuracy, Random Forest achieves 99.02%, "
        "and XGBoost achieves 99.20%, with 100% accuracy on Timing Faults, Signal Integrity Faults, and Nominal circuits."
    ))
    
    # 8. Model comparison bar
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "model_performance_comparison.png"),
        "Figure 8: Benchmark Performance Comparison Across Candidate Architectures",
        "Grouped bar chart comparing Accuracy, Precision, Recall, Macro F1, and Weighted F1. Proves that gradient boosted "
        "decision trees (XGBoost) convincingly outperform linear models and the 16.67% baseline."
    ))
    
    # 9. Error analysis misclassifications
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "error_analysis_misclassifications.png"),
        "Figure 9: Misclassification Pairs and Parameter Boundary Analysis",
        "Left: Breakdown of the 36 misclassified samples, showing that 27 errors occur between Reliability and Thermal faults. "
        "Right: Scatter plot inspecting the physical boundary between Signal Delay and SI Margin, confirming zero errors."
    ))
    
    # 10. SHAP Global Importance Bar
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "shap_feature_importance_bar.png"),
        "Figure 10: Top 15 Global Feature Importances (Mean |SHAP Value|)",
        "Supply voltage, noise margin, and aging factor are the top overall drivers. Three domain-engineered features "
        "(aging_thermal_stress, v2_freq, dynamic_switching_stress) placed inside the top 10 most influential features."
    ))
    
    # 11. SHAP Summary Plot
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "shap_summary_plot.png"),
        "Figure 11: SHAP Feature Importance Decomposed by Fault Category",
        "Stacked bar chart showing class-specific feature contributions. Thermal faults are governed by junction temperature; "
        "Signal Integrity faults by noise margin; Timing faults by voltage and capacitance; Power faults by switching stress."
    ))
    
    # 12. Mitigation confusion matrix
    story.extend(add_figure_slide(
        os.path.join(FIGURES_DIR, "mitigation_confusion_matrix.png"),
        "Figure 12: Confusion Matrix for 16-Class Mitigation Action Prediction",
        "Heatmap showing the performance of the leak-free mitigation classifier. Achieves 55.5% test accuracy across 16 classes "
        "(a 9x improvement over the 6.25% random baseline), predicting appropriate actions directly from sensor telemetry."
    ))

    # -------------------------------------------------------------------------
    # STEP 10: 15 LIKELY VIVA QUESTIONS & ANSWERS (Academic Defense)
    # -------------------------------------------------------------------------
    story.append(Paragraph("Academic Defense: 15 Likely Viva Questions & Answers", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=10, spaceBefore=0))
    story.append(Paragraph("Prepared specifically for college faculty evaluation according to the 10-mark course rubric:", body_style))
    
    viva_qas = [
        ("Q1: What is the primary objective of this project?",
         "To develop an end-to-end classical Machine Learning system that accurately diagnoses one of six hardware fault categories (No Fault, Thermal, Timing, Power, Signal Integrity, Reliability) in Deep Sub-Micron VLSI circuits based on electrical and thermal sensor telemetry."),
         
        ("Q2: Why was Macro F1-score chosen as the primary evaluation metric instead of standard Accuracy?",
         "In multi-class classification, standard accuracy treats all correct predictions equally and can mask catastrophic failure on smaller or critical classes. Macro F1 computes the unweighted harmonic mean of precision and recall across all classes independently, ensuring every fault category is evaluated with equal importance."),
         
        ("Q3: What critical data science finding did you discover regarding the mitigation action labels?",
         "Cross-tabulation revealed that mitigation action (16 classes) is strictly and 100% deterministically mapped to the combination of (fault_type, severity). Treating it as an unconstrained discovery without acknowledging this would be misleading. Furthermore, all mitigation and severity columns had to be excluded from the feature matrix to prevent catastrophic target leakage."),
         
        ("Q4: How did you prevent data leakage during preprocessing and feature engineering?",
         "First, we strictly excluded target columns, severity labels, and one-hot encoded mitigation dummy variables from the input feature matrix. Second, we split data into Train (70%), Validation (15%), and Test (15%) before fitting any transformers. All scalers and encoders were fit strictly on the Train split and applied via transform to Validation and Test."),
         
        ("Q5: Why did you not remove statistical outliers detected by the IQR rule?",
         "In VLSI physics, extreme values (e.g., junction temperature of 115°C or negative SI margins) are not sensor errors or noise—they are the exact physical operational signatures of Thermal and Signal Integrity faults. Removing them would destroy the ground-truth fault signals."),
         
        ("Q6: What feature engineering techniques did you apply, and what was their physical rationale?",
         "We engineered 7 domain-justified features: (1) V^2 * f (dynamic power scaling), (2) V/f (timing slack ratio), (3) Delta T (junction minus ambient temperature), (4) thermal resistance proxy, (5) dynamic switching stress (alpha * C * V^2 * f), (6) SI-to-noise ratio, and (7) aging-thermal compound stress. SHAP analysis confirmed three of these ranked in the top 10 most influential features."),
         
        ("Q7: Why did you start with a Dummy Classifier?",
         "To establish a rigorous mathematical baseline. For 6 balanced classes, random chance yields ~16.67% accuracy and ~0.0476 Macro F1. Demonstrating that our models achieve >98% proves they capture genuine physical laws rather than trivial class balance heuristics."),
         
        ("Q8: Why did you evaluate both Logistic Regression and Tree Ensembles?",
         "To compare linear decision boundaries against non-linear interaction models. Logistic Regression provided a fast, interpretable linear benchmark (98.07% Macro F1), while XGBoost and Random Forest captured complex electro-thermal interactions (99.20% Macro F1)."),
         
        ("Q9: Which fault classes were most frequently confused with each other, and why?",
         "Reliability Fault and Thermal Fault accounted for 27 of the 36 total test errors (0.80% error rate). Physically, both faults involve severe thermal stress (Tj > 95°C) and electromigration wearout, creating boundary overlap near degradation thresholds."),
         
        ("Q10: Why did Timing Faults and Signal Integrity Faults achieve 100% precision and recall?",
         "Because they possess unmistakable orthogonal physical signatures: Timing Faults are driven by undervoltage (<0.92V) combined with high propagation delay, while Signal Integrity Faults are uniquely characterized by near-zero or negative SI margins."),
         
        ("Q11: What is SHAP, and how does it differ from traditional Gini feature importance?",
         "SHAP is rooted in cooperative game theory (Shapley values). Unlike Gini importance (which is biased towards high-cardinality features and lacks directional clarity), SHAP computes the exact additive marginal contribution of each feature to a sample's log-odds, showing both magnitude and direction."),
         
        ("Q12: Can high SHAP importance be interpreted as a causal relationship?",
         "No. SHAP identifies statistical attribution and predictive importance within the model's learned structure; it does not establish physical causality without controlled intervention experiments."),
         
        ("Q13: How was cross-validation performed?",
         "Using 5-Fold Stratified Cross-Validation strictly inside the 21,000-sample training set. This ensured validation scores had zero leakage from the held-out test set."),
         
        ("Q14: Why was deep learning (CNN/LSTM) deliberately avoided?",
         "This dataset consists of tabular, non-sequential electrical parameters. Deep learning architectures like CNN/LSTM introduce unnecessary computational overhead, require arbitrary architectural tuning, risk overfitting, and lack the interpretability and performance of gradient boosted trees on tabular data."),
         
        ("Q15: What is the practical engineering value of this project in an industrial semiconductor fab?",
         "In automated semiconductor test benches (ATE), running this inference pipeline in real time allows fab engineers to diagnose whether an IC failed due to supply drop, thermal dissipation failure, or silicon wearout in under 1 millisecond, automatically dispatching the appropriate mitigation (e.g., DVFS, buffer insertion, or redundancy).")
    ]
    
    for q, a in viva_qas:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(a, body_style))
        story.append(Spacer(1, 4))
        
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated PDF Report: {ROOT_PDF}")
    
    # Copy to reports/ as well
    import shutil
    shutil.copyfile(ROOT_PDF, REPORTS_PDF)
    print(f"Copied to: {REPORTS_PDF}")


if __name__ == "__main__":
    build_pdf()

