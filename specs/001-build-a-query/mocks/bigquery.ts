// Mock implementation of BigQuery for testing
export class MockBigQuery {
  private mockResults: any[];
  private shouldFail: boolean;
  private errorMessage: string;

  constructor() {
    this.mockResults = [];
    this.shouldFail = false;
    this.errorMessage = '';
  }

  setMockResults(results: any[]) {
    this.mockResults = results;
  }

  setShouldFail(fail: boolean, message: string = 'Query execution failed') {
    this.shouldFail = fail;
    this.errorMessage = message;
  }

  async query(_sql: string) {
    if (this.shouldFail) {
      throw new Error(this.errorMessage);
    }

    return {
      rows: this.mockResults
    };
  }
}
