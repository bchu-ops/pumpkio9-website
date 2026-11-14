## Project Setup Process

The SpeedDemon project setup is straightforward and automated via a shell script:

### Quick Start
Run the setup script from the project root:
```bash
source scripts/setup.sh
```

### What the Setup Does

1. **Creates Virtual Environment**: If `.venv` doesn't exist, it creates a Python 3 virtual environment
2. **Activates Environment**: Activates the virtual environment for dependency installation
3. **Installs Dependencies**: Installs all required packages from requirements.txt using pip, logging output to `.pip.log`
4. **Reports Installation Status**: Displays a summary showing:
   - Number of newly installed packages
   - Number of existing satisfied packages
   - Count of any errors encountered

### Requirements
The project uses the following key dependencies:
- **Data Processing**: pandas, numpy, scipy
- **Visualization**: matplotlib, pillow
- **Racing Data**: FastF1 (for F1 telemetry data)
- **API Communication**: requests, signalrcore
- **Machine Learning**: scikit-learn related packages

### To Persist Virtual Environment
After running setup, the virtual environment is activated for that session. To keep it activated in your current shell, run:
```bash
source scripts/setup.sh
```

To deactivate, run:
```bash
deactivate
```

The project appears to be focused on **kart racing optimization** using telemetry data analysis with OpenAI/Groq AI integration and PostgreSQL for data storage.

