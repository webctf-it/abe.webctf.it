const puppeteer = require("puppeteer-core")
const config = require("config")

const botVisit =  async (uuid) => {
    const args = [
        "--no-sandbox",
        "--disable-gpu"
    ]
    const browser = await puppeteer.launch({headless: config.headless, executablePath: config.chromePath, args: args})
    const page = await browser.newPage()
    const url = config.botReqUrl 
    const cookies = [
        { 'name': 'session', 'value': uuid, 'httpOnly': true, 'domain': '127.0.0.1' },
        { 'name': 'secret', 'value': config.secret, 'httpOnly': false, 'domain': '127.0.0.1' }
    ]
    await page.setCookie(...cookies)
    await page.goto(`${url}/notes`)

    await page.waitForTimeout(3000)
    await browser.close()
}

module.exports = {botVisit}
