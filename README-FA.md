# Vacuum CTF Challenge - 1
# راهنمای چالش

## استیج ۱

### مرحله ۱: گرفتن اولین سرنخ
برای رد کردن مرحله ۱ کافی بود به بخش **Network** در **Inspect Element** بروید و درخواست مربوط به صفحه استیج ۱ را باز کنید. در بخش هدرها این سرنخ را به دست می‌آوردید:

> **X-Hidden-Clue**: For start send 'triggerXSS' in Comment. Look at response headers!

کافی بود `triggerXSS` را در **Comment** ارسال کنید تا مرحله ۱ رد شود. سپس سرنخی برای مرحله دوم دریافت می‌کردید:

> **X-Next-Step**: Inject a fetch to /api/check?token=initiate in an attribute

### مرحله ۲: اجرای **fetch** اول
حالا باید کاری کنیم که رشته زیر در **Comment** ظاهر شود:

```javascript
fetch('/api/check?token=initiate')
```

اما مشکل اینجاست: اگر این را مستقیم وارد کنید، کد **PHP** بررسی می‌کند که آیا `$_GET['token'] == "initiate"` هم هست یا نه. پس باید پارامتر `token` را هم در **URL** بفرستید. بنابراین این مقدار را به **URL** وارد می‌کنیم:

```
?comment=fetch('/api/check?token=initiate')&token=initiate
```

سپس مرحله ۲ رد می‌شود و یک هدر جدید حاوی سرنخ مرحله ۳ دریافت می‌کنید:

> **X-Final-Step**: Inject fetch('/api/validate?key=unlock') in a hidden element

### مرحله ۳: تزریق **fetch** دوم در عنصر مخفی
در این مرحله باید کاری کنیم که رشته زیر در **Comment** ظاهر شود:

```javascript
fetch('/api/validate?key=unlock')
```

و همچنین پارامتر `key=unlock` هم در **URL** باشد. پس این مقدار را به **URL** وارد می‌کنیم:

```
?comment=fetch('/api/validate?key=unlock')&key=unlock
```

سپس پیام زیر را دریافت می‌کردید:

> Proceed to Stage 2

به همراه یک لینک برای ورود به استیج دوم. همچنین **فلاگ** این استیج در کدهای صفحه پنهان شده بود که البته چه آن را پیدا می‌کردید چه نه، نیازی به آن نبود:

```html
<div style='display:none;' id='flag'>Flag: flag{The_next_step_is_harder}</div>
```

## استیج ۲

### مرحله ۱: شروع چالش
وقتی وارد صفحه **Stage 2** می‌شوید، یک فیلد `token` و یک فیلد `query` دارید. اگر در حالت اولیه **Inspect** کنید، در بخش `<head>` صفحه این خط را می‌بینید:

```html
<meta name="hint" content="To start, submit the value 'start' in the token field">
```

این یعنی باید در فیلد `token` مقدار `start` را وارد کنید.

### مرحله ۲: ارسال توکن زمانی (**Time-based Token**)
در مرحله دوم اگر به کد صفحه نگاه کنید، این کد **JavaScript** را مشاهده می‌کنید:

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

اگر مجدداً بخش **Inspect Element** و تب **Network** را مشاهده کنید، یک درخواست به صفحه‌ای به نام `get.php` ارسال شده و پاسخ چنین چیزی بوده:

```json
{
    "lable_token": "Token",
    "lable_Query": "Query",
    "Hint": "Use a time-based hash (first 10 chars). Time is ticking! (20s)"
}
```

این راهنمایی به شما می‌گوید که باید زمان فعلی را به یک **هش** تبدیل کنید. این کار را می‌توانید با **JavaScript** یا حتی **Python** انجام دهید:

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

پس از وارد کردن توکن، این راهنمایی در بخش **کوکی** به صورت **Base64** دریافت می‌شد:

> You need to pad admin=1 to exactly 16 bytes and encrypt it with AES-128-ECB using the fixed key ThisIsTheKey1234. Then swap this encrypted block into the token in place of the admin=0 block. Because ECB encrypts blocks independently, this block swap will give you admin access and unlock the flag.

اما نکته این مرحله این بود که شما فقط **۲۰ ثانیه** فرصت داشتید توکن‌های مربوط به زمان آینده را تولید و وارد کنید تا این مرحله را رد کنید.

### مرحله ۳: حمله به رمزنگاری **ECB** برای گرفتن **Flag**

**تکنیک حمله:**
- **AES-128** = بلاک‌های ۱۶ بایتی
- **ECB** هر بلاک را جداگانه رمزنگاری می‌کند. اگر بلاک‌های مشخصی را جابه‌جا کنیم، می‌توانیم رفتار رمزگشایی را کنترل کنیم.

**💡 استراتژی:**
1. یک **Query** بدهید که `admin=1` در ابتدای یک بلاک قرار بگیرد.
2. بلاک خروجی آن را جدا کنید.
3. در یک درخواست دیگر، این بلاک را جای بلاک اول (که `admin=0` است) قرار دهید.

با یک کد ساده **PHP** یا **JavaScript** می‌توانید این کار را انجام دهید:

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

## مرحله سوم: ماشین حالت (**State Machine**)
استیج ۳ این چالش یک **ماشین حالت** دارد که باید با وارد کردن یک رشته کاراکتری (**Sequence**) درست، به حالت نهایی برسید. پس از باز کردن این صفحه، با یک توضیح درباره مرحله و یک راهنمایی روی صفحه مواجه می‌شوید:

> There are two valid answers: the first is within the range of 'a' to 'g', and the second is within the range of 'b' to 'g'.

به راحتی می‌توانید با این کد **JavaScript** تمام احتمالات را پیدا کنید و جواب‌ها را **Submit** کنید:

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

در واقع جواب دوم فقط برای گمراه کردن شما بود. چرا؟ چون وقتی دامنه جواب اول از `a` تا `g` است، جواب دوم که بین `b` تا `g` است، قطعاً در احتمالات پاسخ اول یافت می‌شود.

- تعداد احتمالات دامنه اول: **۳۴۳**
- تعداد احتمالات دامنه دوم: **۲۱۶**

امیدوارم از دوره اول مسابقات لذت برده باشید و منتظر شما در دوره بعدی هم هستیم!
