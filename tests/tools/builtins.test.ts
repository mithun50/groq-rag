import { describe, it, expect } from 'vitest';
import {
  createCalculatorTool,
  createDateTimeTool,
  getBuiltinTools,
} from '../../src/tools/builtins';

describe('builtin tools', () => {
  describe('createCalculatorTool', () => {
    const calculator = createCalculatorTool();

    it('should have correct metadata', () => {
      expect(calculator.name).toBe('calculator');
      expect(calculator.description).toBeTruthy();
      expect(calculator.parameters.properties.expression).toBeDefined();
    });

    it('should evaluate basic arithmetic', async () => {
      const result = await calculator.execute({ expression: '2 + 2' });
      expect(result).toEqual({ expression: '2 + 2', result: 4 });
    });

    it('should evaluate multiplication', async () => {
      const result = await calculator.execute({ expression: '3 * 4' });
      expect(result).toEqual({ expression: '3 * 4', result: 12 });
    });

    it('should evaluate division', async () => {
      const result = await calculator.execute({ expression: '10 / 2' });
      expect(result).toEqual({ expression: '10 / 2', result: 5 });
    });

    it('should evaluate parentheses', async () => {
      const result = await calculator.execute({ expression: '(2 + 3) * 4' });
      expect(result).toEqual({ expression: '(2 + 3) * 4', result: 20 });
    });

    it('should handle invalid expressions', async () => {
      const result = await calculator.execute({ expression: 'invalid' }) as { error: string };
      expect(result.error).toBe('Invalid expression');
    });

    it('should sanitize dangerous input', async () => {
      // Should strip non-math characters
      const result = await calculator.execute({ expression: 'process.exit()' }) as { error: string };
      expect(result.error).toBeDefined();
    });
  });

  describe('createDateTimeTool', () => {
    const datetime = createDateTimeTool();

    it('should have correct metadata', () => {
      expect(datetime.name).toBe('get_datetime');
      expect(datetime.description).toBeTruthy();
    });

    it('should return current datetime', async () => {
      const result = await datetime.execute({}) as {
        datetime: string;
        timezone: string;
        timestamp: string;
        unix: number;
      };

      expect(result.datetime).toBeTruthy();
      expect(result.timezone).toBe('UTC');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.unix).toBeGreaterThan(0);
    });

    it('should handle timezone parameter', async () => {
      const result = await datetime.execute({ timezone: 'America/New_York' }) as {
        timezone: string;
      };

      expect(result.timezone).toBe('America/New_York');
    });

    it('should fallback to UTC for invalid timezone', async () => {
      const result = await datetime.execute({ timezone: 'Invalid/Zone' }) as {
        timezone: string;
      };

      expect(result.timezone).toBe('UTC');
    });
  });

  describe('getBuiltinTools', () => {
    it('should return array of tools', () => {
      const tools = getBuiltinTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should include expected tools', () => {
      const tools = getBuiltinTools();
      const names = tools.map(t => t.name);

      expect(names).toContain('web_search');
      expect(names).toContain('fetch_url');
      expect(names).toContain('calculator');
      expect(names).toContain('get_datetime');
    });

    it('should return tools with valid structure', () => {
      const tools = getBuiltinTools();

      tools.forEach(tool => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.parameters.type).toBe('object');
        expect(typeof tool.execute).toBe('function');
      });
    });
  });
});
