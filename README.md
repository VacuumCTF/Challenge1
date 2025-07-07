# Vacuum CTF Challenge - 1

## Challenge Walkthrough

برای مطالعه پاسخ ها به زبان فارسی به <a href="README-FA.md">این صفحه</a> مراجعه کنید.
## Stage 1

### Step 1: Obtaining the First Clue
To pass Stage 1, you just needed to go to the **Network** tab in **Inspect Element** and open the request related to the Stage 1 page. In the headers section, you would find this clue:

> **X-Hidden-Clue**: For start send 'triggerXSS' in Comment. Look at response headers!

All you had to do was send `triggerXSS` in the **Comment** field to clear Stage 1. Then, you would receive a clue for the next step:

> **X-Next-Step**: Inject a fetch to /api/check?token=initiate in an attribute

### Step 2: Executing the First **Fetch**
Now, you need to make the following string appear in the **Comment** field:

```javascript
fetch('/api/check?token=initiate')
```

The problem is: if you enter this directly, the **PHP** code checks whether `$_GET['token'] == "initiate"` is also present. So, you need to include the `token` parameter in the **URL** as well. Thus, you add this to the **URL**:

```
?comment=fetch('/api/check?token=initiate')&token=initiate
```

Then, Stage 2 is cleared, and you receive a new header containing the clue for Step 3:

> **X-Final-Step**: Inject fetch('/api/validate?key=unlock') in a hidden element

### Step 3: Injecting the Second **Fetch** in a Hidden Element
In this step, you need to make the following string appear in the **Comment** field:

```javascript
fetch('/api/validate?key=unlock')
```

And the parameter `key=unlock` must also be in the **URL**. So, you add this to the **URL**:

```
?comment=fetch('/api/validate?key=unlock')&key=unlock
```

Then, you would receive the following message:

> Proceed to Stage 2

Along with a link to enter Stage 2. Additionally, the **flag** for this stage was hidden in the page's code, though you didn’t need it whether you found it or not:

```html
<div style='display:none;' id='flag'>Flag: flag{The_next_step_is_harder}</div>
```

## Stage 2

### Step 1: Starting the Challenge
When you enter the **Stage 2** page, you see a `token` field and a `query` field. If you inspect the page in its initial state, you’ll see this line in the `<head>` section:

```html
<meta name="hint" content="To start, submit the value 'start' in the token field">
```

This means you need to enter the value `start` in the `token` field.

### Step 2: Submitting a Time-Based Token
In Step 2, if you look at the page’s code, you’ll see this **JavaScript** code:

```javascript
fetch("get.php")
    .then(response => response.json())
    .then(data => {
        if (data.lable_token && data.lable_Query) {
            document.getElementById("label_token").previousElementSibling.textContent = data.lable_token;
            document.getElementById("label_query").previousElementSibling.textContent = data.lable_Query;
        }
    })
    .catch(() => {});
```

If you check the **Inspect Element** and the **Network** tab again, you’ll see a request sent to a page called `get.php`, with a response like this:

```json
{
    "lable_token": "Token",
    "lable_Query": "Query",
    "Hint": "Use a time-based hash (first 10 chars). Time is ticking! (20s)"
}
```

This hint tells you that you need to convert the current time into a **hash**. You can do this using **JavaScript** or even **Python**:

```javascript
async function generateSeeds() {
    const encoder = new TextEncoder();
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i <= 20; i++) {
        const t = (now - i).toString();
        const data = encoder.encode(t);

        const hashBuffer = await crypto.subtle.digest("SHA-1", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        console.log(hex.slice(0, 10));
    }
}

generateSeeds();
```

After submitting the token, you would receive this hint in the **cookie** section encoded in **Base64**:

> You need to pad admin=1 to exactly 16 bytes and encrypt it with AES-128-ECB using the fixed key ThisIsTheKey1234. Then swap this encrypted block into the token in place of the admin=0 block. Because ECB encrypts blocks independently, this block swap will give you admin access and unlock the flag.

The catch in this step was that you only had **20 seconds** to generate and submit the tokens for the upcoming time to pass this stage.

### Step 3: Attacking **ECB** Encryption to Obtain the **Flag**

**Attack Technique:**
- **AES-128** = 16-byte blocks
- **ECB** encrypts each block independently. If you swap specific blocks, you can control the decryption behavior.

**💡 Strategy:**
1. Submit a **Query** that places `admin=1` at the start of a block.
2. Extract the output block.
3. In another request, replace the first block (which has `admin=0`) with this block.

You can do this with a simple **PHP** or **JavaScript** code:

**JavaScript:**

```javascript
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
```

**PHP:**

```php
<?php
$key = "ThisIsTheKey1234";

function encodeData($data, $key) {
    return bin2hex(openssl_encrypt($data, "aes-128-ecb", $key, OPENSSL_RAW_DATA));
}

$block = "admin=1" . str_repeat(chr(9), 9);
$enc_block = encodeData($block, $key);
echo $enc_block;
?>
```

## Step 3: State Machine
Stage 3 of this challenge involves a **State Machine** where you need to reach the final state by entering the correct character sequence. Upon opening this page, you’ll see a description of the stage and a hint displayed on the page:

> There are two valid answers: the first is within the range of 'a' to 'g', and the second is within the range of 'b' to 'g'.

You can easily find all possibilities and submit the answers with this **JavaScript** code:

```javascript
const chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function* generateSequences(length, prefix = '') {
  if (length === 0) yield prefix;
  else for (const c of chars) yield* generateSequences(length - 1, prefix + c);
}

const isInRange = (str, start, end) => [...str].every(c => c >= start && c <= end);

const first = [], second = [];
for (const seq of generateSequences(3)) {
  if (isInRange(seq, 'a', 'g')) first.push(seq);
  if (isInRange(seq, 'b', 'g')) second.push(seq);
}

console.log(`First answer (a-g): ${first.length} sequences\n${first.join(', ')}`);
console.log(`\nSecond answer (b-g): ${second.length} sequences\n${second.join(', ')}`);
console.log(`\nAll possible (first or second): ${first.length} sequences\n${first.join(', ')}`);
```

In fact, the second answer was just meant to mislead you. Why? Because when the range for the first answer is from `a` to `g`, the second answer, which is between `b` to `g`, is definitely included in the possibilities of the first answer.

- Number of possibilities for the first range: **343**
- Number of possibilities for the second range: **216**

Hope you enjoyed the first round of the competition, and we look forward to seeing you in the next round!
