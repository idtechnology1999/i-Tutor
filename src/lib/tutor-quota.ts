/** Free accounts get a few tutor questions a day; Premium is unlimited. */
export const FREE_DAILY = 5;

const quotaKey = () => `itutor-tutor-${new Date().toISOString().slice(0, 10)}`;

export const readUsed = () => {
  try {
    return Number(window.localStorage.getItem(quotaKey()) ?? 0) || 0;
  } catch {
    return 0;
  }
};

export const writeUsed = (n: number) => {
  try {
    window.localStorage.setItem(quotaKey(), String(n));
  } catch {
    /* storage blocked — the count simply resets on reload */
  }
};
