const fs = require('fs');

// Read the JSON file asynchronously
fs.readFile('brokerage_and_marketing-200_recoreds.json', 'utf8', (err, data) => {
  if (err) {
    console.log('Error reading the file:', err);
    return;
  }
  
  // Parse the JSON content
  const jsonData = JSON.parse(data);

  // Assuming the JSON data is an array of entries
  console.log('Number of entries:', jsonData.length);
});
