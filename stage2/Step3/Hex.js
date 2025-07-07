(async () => {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
  document.head.appendChild(script);
  await new Promise(resolve => script.onload = resolve);

  const key = CryptoJS.enc.Utf8.parse("ThisIsTheKey1234");
  const block = "admin=1" + String.fromCharCode(9).repeat(9);
  const plaintext = CryptoJS.enc.Utf8.parse(block);

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });

  const hexOutput = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  console.log(hexOutput);
})();