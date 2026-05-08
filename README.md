# Tamil-Alakidal-Pro

அலகிடுதல் — Thirukkural Alakidal Analysis Tool

A modern web application for analyzing the prosody (சீர், அசை, வாய்பாடு) of Thirukkural verses. Built with pure JavaScript logic and a responsive HTML/CSS interface.

## 🌟 Features

- **Prosody Analysis**: Automatically breaks down Thirukkural verses into சீர் (words), அசை (syllables), and வாய்பாடு (meter)
- **API Integration**: Fetch Thirukkural verses directly from an online API by entering the verse number (1-1330)
- **History Tracking**: Save and review past analyses with PDF export capability
- **Dark Mode**: Toggle between light and dark themes for comfortable reading
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Tamil Font Support**: Uses Mukti Malar font for authentic Tamil typography
- **Offline Capable**: Runs entirely in the browser with no server dependencies

## 🚀 Quick Start

### Prerequisites
- Python 3.x (for local server)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sakthivelan20040901/Tamil-Alakidal-Pro.git
   cd Tamil-Alakidal-Pro
   ```

2. **Start the local server:**
   ```bash
   python -m http.server 8000
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8000/alakidal_app.html`

## 📖 Usage

### Analyzing a Verse

1. **Manual Input**: Paste or type a Thirukkural verse in the text area
2. **API Fetch**: Enter a verse number (1-1330) and click "Fetch" to load from the API
3. **Analyze**: Click "ஆய்வு செய் (Analyze)" to see the prosody breakdown

### Features Overview

- **Example Verse**: Click "எடுத்துக்காட்டு" to load a sample verse
- **Copy Results**: Use "முடிவுகளை நகலெடு" to copy analysis to clipboard
- **History**: View past analyses in the history modal
- **Clear All**: Reset the interface
- **Dark Mode**: Toggle with the moon/sun icon in the top-right

## 🏗️ Project Structure

```
Tamil-Alakidal-Pro/
├── alakidal_app.html    # Main UI and user interface
├── alakidal_logic.js    # Core prosody analysis logic
├── README.md            # This file
└── .venv/               # Python virtual environment (optional)
```

## 🧠 Technical Details

### Analysis Algorithm

The tool implements traditional Tamil prosody rules:

- **Tokenization**: Breaks text into ஒற்று (consonants), நெடில் (long vowels), குறில் (short vowels)
- **Segmentation**: Groups tokens into அசை (syllable groups)
- **Classification**: Determines நேர் vs நிரை அசை types
- **Meter Calculation**: Applies வாய்பாடு rules for final classification

### Technologies Used

- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+)
- **Fonts**: Google Fonts (Mukti Malar)
- **Libraries**: html2pdf.js for PDF generation
- **Styling**: Responsive design with dark mode support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test locally with the Python server
5. Commit and push: `git push origin feature-name`
6. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Based on Tamil prosody rules from "பொதுத்தேர்வு வழிகாட்டி (தமிழ் II)" pp. 28–30
- Thirukkural API by [thirukkural-api-jyle](https://thirukkural-api-jyle.onrender.com/)
- Font: Mukti Malar by Google Fonts

## 📞 Contact

For questions or feedback, please open an issue on GitHub.

---

**Note**: This tool is for educational purposes and follows traditional Tamil grammatical rules. Results should be verified with expert knowledge for academic use.
