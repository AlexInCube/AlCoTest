export function getCurrentTimestamp(): string {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
  const yyyy = String(today.getFullYear()).padStart(2, '0');
  const hour = String(today.getHours()).padStart(2, '0');
  const minute = String(today.getMinutes()).padStart(2, '0');
  const seconds = String(today.getSeconds()).padStart(2, '0');

  return `${dd + '/' + mm + '/' + yyyy + ' | ' + hour + ':' + minute + ':' + seconds}`;
}

export function loggerSend(
  message: unknown,
  prefix?: string,
  isError?: boolean,
  isWarn?: boolean
): void {
  if (message instanceof Error || isError) {
    console.error(
      `[ ${getCurrentTimestamp()} ] [ ${prefix ? `${prefix} | ERROR` : 'ERROR'} ]`,
      message
    );
    return;
  }

  if (isWarn) {
    console.warn(
      `[ ${getCurrentTimestamp()} ] [ ${prefix ? `${prefix} | WARN` : 'WARN'} ]`,
      message
    );
    return;
  }

  let finalOutput = '';

  switch (typeof message) {
    case 'object':
      finalOutput += JSON.stringify(message);
      break;
    default:
      finalOutput += message;
  }

  if (prefix) {
    console.log(`[ ${getCurrentTimestamp()} ] [ ${prefix} ] ${finalOutput}`);
  } else {
    console.log(`[ ${getCurrentTimestamp()} ] ${finalOutput}`);
  }
}

export function loggerError(message: unknown, prefix?: string) {
  loggerSend(message, prefix, true);
}

export function loggerWarn(message: unknown, prefix?: string) {
  loggerSend(message, prefix, undefined, true);
}
