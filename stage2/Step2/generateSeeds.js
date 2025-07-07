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