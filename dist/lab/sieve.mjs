import { countPrimes } from './math.mjs';

self.onmessage = ({data}) => {
  try {
    self.postMessage({count: countPrimes(data.a, data.width)});
  } catch (error) {
    self.postMessage({error: error.message});
  }
};
