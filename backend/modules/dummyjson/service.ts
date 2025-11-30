export class DummyJSONService {
  async getProducts() {
    const res = await fetch('https://dummyjson.com/products');
    return res.json();
  }
}