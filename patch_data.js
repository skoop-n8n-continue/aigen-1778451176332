const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

data.sections.app_settings.preview_mode = {
  "type": "enum",
  "label": "Preview Mode",
  "value": "auto",
  "meta": { "options": ["auto", "regular", "lunch-rush", "late-night"] }
};

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
