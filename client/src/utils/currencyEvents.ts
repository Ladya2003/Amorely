import axios from 'axios';

export const CURRENCY_UPDATED_EVENT = 'amorely:currency-updated';

export const emitCurrencyUpdated = (balance?: number, awardedAmount?: number) => {
  window.dispatchEvent(
    new CustomEvent(CURRENCY_UPDATED_EVENT, { detail: { balance, awardedAmount } })
  );
};

let currencyInterceptorRegistered = false;

/** Emits currency events for any API response that includes awardedAmount. */
export const setupCurrencyAxiosInterceptor = () => {
  if (currencyInterceptorRegistered) {
    return;
  }
  currencyInterceptorRegistered = true;

  axios.interceptors.response.use((response) => {
    const data = response.data;
    if (!data || typeof data !== 'object') {
      return response;
    }

    const awardedAmount = Number((data as { awardedAmount?: unknown }).awardedAmount);
    if (Number.isFinite(awardedAmount) && awardedAmount > 0) {
      const balance = (data as { balance?: unknown }).balance;
      emitCurrencyUpdated(typeof balance === 'number' ? balance : undefined, awardedAmount);
    }

    return response;
  });
};
