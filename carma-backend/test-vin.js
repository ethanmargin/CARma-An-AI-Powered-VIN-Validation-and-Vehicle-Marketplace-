const VINExtractor = require('./utils/vinExtractor');

console.log('🧪 VIN Extraction Test Suite\n');
console.log('='.repeat(60));

// Test 1: Your image text (from the Honda label)
console.log('\n📋 TEST 1: Real VIN Label (Your Honda Image)');
console.log('-'.repeat(60));
const text1 = `MFD. BY HONDA OF CANADA MFG.
A DIVISION OF HONDA CANADA INC.
GVWR 3671LBS GAWR F 1940LBS R 1731LBS
V.I.N. 2HGFA1F54AH570372
PASSENGER CAR`;

console.log('Input Text:');
console.log(text1);
console.log('\nExtracting...');
const vin1 = VINExtractor.extractFromLabel(text1);
const valid1 = VINExtractor.isValidVIN(vin1);
console.log('\n✅ RESULT:');
console.log(`   Extracted VIN: ${vin1}`);
console.log(`   Valid Check Digit: ${valid1 ? '✓ YES' : '✗ NO'}`);

// Test 2: Messy text with mixed numbers
console.log('\n\n📋 TEST 2: Mixed Text with Multiple Numbers');
console.log('-'.repeat(60));
const text2 = '3671LBS 1940LBS 2HGFA1F54AH570372 1731LBS BARCODE';
console.log('Input Text:', text2);
console.log('\nExtracting...');
const vin2 = VINExtractor.extractVIN(text2);
const valid2 = VINExtractor.isValidVIN(vin2);
console.log('\n✅ RESULT:');
console.log(`   Extracted VIN: ${vin2}`);
console.log(`   Valid Check Digit: ${valid2 ? '✓ YES' : '✗ NO'}`);

// Test 3: VIN with excluded characters (I, O, Q)
console.log('\n\n📋 TEST 3: VIN with Invalid Characters (I, O, Q)');
console.log('-'.repeat(60));
const text3 = 'VIN: 2HGFAlF54AH57O372'; // Has lowercase 'l' and 'O'
console.log('Input Text:', text3);
console.log('Note: Contains invalid characters (l, O)');
console.log('\nExtracting and cleaning...');
const vin3 = VINExtractor.extractVIN(text3);
const valid3 = VINExtractor.isValidVIN(vin3);
console.log('\n✅ RESULT:');
console.log(`   Extracted VIN: ${vin3}`);
console.log(`   Valid Check Digit: ${valid3 ? '✓ YES' : '✗ NO'}`);

// Test 4: Another real VIN
console.log('\n\n📋 TEST 4: Another Real VIN (Toyota)');
console.log('-'.repeat(60));
const text4 = 'VEHICLE IDENTIFICATION NUMBER 5TFDY5F17KX901234';
console.log('Input Text:', text4);
console.log('\nExtracting...');
const vin4 = VINExtractor.extractFromLabel(text4);
const valid4 = VINExtractor.isValidVIN(vin4);
console.log('\n✅ RESULT:');
console.log(`   Extracted VIN: ${vin4}`);
console.log(`   Valid Check Digit: ${valid4 ? '✓ YES' : '✗ NO'}`);

// Test 5: Invalid VIN (wrong length)
console.log('\n\n📋 TEST 5: Invalid VIN (Wrong Length)');
console.log('-'.repeat(60));
const text5 = 'VIN: 2HGFA1F54AH57';
console.log('Input Text:', text5);
console.log('\nExtracting...');
const vin5 = VINExtractor.extractVIN(text5);
const valid5 = vin5 ? VINExtractor.isValidVIN(vin5) : false;
console.log('\n✅ RESULT:');
console.log(`   Extracted VIN: ${vin5 || 'NONE'}`);
console.log(`   Valid Check Digit: ${valid5 ? '✓ YES' : '✗ NO'}`);

// Test 6: Test check digit validation directly
console.log('\n\n📋 TEST 6: Direct VIN Validation Check');
console.log('-'.repeat(60));
const testVINs = [
  '2HGFA1F54AH570372', // Your Honda - should be valid
  '1HGBH41JXMN109186', // Another Honda - should be valid
  '1HGBH41JXMN109187', // Same but wrong check digit - should be invalid
];

testVINs.forEach((vin, index) => {
  const isValid = VINExtractor.isValidVIN(vin);
  console.log(`\n   ${index + 1}. ${vin}`);
  console.log(`      Valid: ${isValid ? '✓ YES' : '✗ NO'}`);
});

console.log('\n\n' + '='.repeat(60));
console.log('✅ All tests completed!\n');