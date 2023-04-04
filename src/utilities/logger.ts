export function getCurrentTimestamp(): string {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0') // January is 0!
    const yyyy = String(today.getFullYear()).padStart(2, '0')
    const hour = String(today.getHours()).padStart(2, '0')
    const minute = String(today.getMinutes()).padStart(2, '0')
    const seconds = String(today.getSeconds()).padStart(2, '0')

    return `${dd + '/' + mm + '/' + yyyy + ' | ' + hour + ':' + minute + ':' + seconds}`
}

export function loggerSend(message: any): void {
    let finalOutput = ""

    switch (typeof message) {
        case 'object':
            finalOutput += JSON.stringify(message)
            break
        default:
            finalOutput += message
    }

    console.log(`[ ${getCurrentTimestamp()} ] ${finalOutput}`)
}