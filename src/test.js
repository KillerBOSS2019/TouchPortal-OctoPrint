const axios = require("axios");

async function urlToBase64(url) {
    let image = await axios.get(url, {responseType: 'arraybuffer'});
    return Buffer.from(image.data).toString('base64');
}


urlToBase64("http://192.168.12.144:8001?action=snapshot").then((data) => {
    console.log(data)
})
