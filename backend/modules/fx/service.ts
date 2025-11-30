export class FxService {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async getRate() {
    const cached = await this.kv.get('fx-rate');
    if (cached) {
      return { rate: parseFloat(cached), source: 'cache' };
    }

    // Placeholder for real API call
    const rate = 1.35;
    await this.kv.put('fx-rate', rate.toString(), { expirationTtl: 3600 });
    return { rate, source: 'api' };
  }
}