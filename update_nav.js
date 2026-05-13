const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/page.js');
let page = fs.readFileSync(pagePath, 'utf8');

if (!page.includes('const navigateToHistory = (patientData)')) {
  page = page.replace(
    /const navigateToPrescribe = \(patientData\) => \{[\s\S]*?router\.push\("\/prescribe"\);\s*\};/,
    `$&
  const navigateToHistory = (patientData) => {
    sessionStorage.setItem("medvault_patient", JSON.stringify(patientData));
    router.push("/history");
  };`
  );
}

page = page.replace(
  /onClick=\{\(\) => alert\("Accessing encrypted vault\.\.\. Patient authorization is required to view past documentations\."\)\}/,
  'onClick={() => navigateToHistory(scannedData)}'
);

fs.writeFileSync(pagePath, page);
