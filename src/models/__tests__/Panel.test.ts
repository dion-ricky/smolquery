import { describe, it, expect, beforeEach } from 'vitest';
import Panel, { PanelTypes, type PanelType } from '../Panel';

describe('Panel model', () => {
  let testPanel: Panel;

  beforeEach(() => {
    testPanel = new Panel({
      id: 'test-panel-1',
      type: PanelTypes.Results,
      title: 'Test Results Panel',
      open: true,
      order: 1
    });
  });

  describe('constructor', () => {
    it('constructs with all fields provided', () => {
      const panel = new Panel({
        id: 'panel1',
        type: PanelTypes.Schema,
        title: 'Schema Browser',
        open: false,
        order: 2
      });

      expect(panel.id).toBe('panel1');
      expect(panel.type).toBe('schema');
      expect(panel.title).toBe('Schema Browser');
      expect(panel.open).toBe(false);
      expect(panel.order).toBe(2);
    });

    it('constructs with minimal required fields', () => {
      const panel = new Panel({
        id: 'minimal',
        type: PanelTypes.Console
      });

      expect(panel.id).toBe('minimal');
      expect(panel.type).toBe('console');
      expect(panel.title).toBeUndefined();
      expect(panel.open).toBe(true); // default
      expect(panel.order).toBe(0); // default
    });

    it('applies default values correctly', () => {
      const panel = new Panel({
        id: 'defaults',
        type: PanelTypes.Settings,
        order: undefined
      });

      expect(panel.open).toBe(true);
      expect(panel.order).toBe(0);
    });

    it('throws TypeError for invalid payload', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new Panel(null as any)).toThrow(TypeError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new Panel('invalid' as any)).toThrow(TypeError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new Panel(42 as any)).toThrow(TypeError);
    });

    it('handles numeric order values correctly', () => {
      const panel1 = new Panel({ id: 'p1', type: PanelTypes.Results, order: 5 });
      const panel2 = new Panel({ id: 'p2', type: PanelTypes.Results, order: 0 });
      const panel3 = new Panel({ id: 'p3', type: PanelTypes.Results, order: -1 });

      expect(panel1.order).toBe(5);
      expect(panel2.order).toBe(0);
      expect(panel3.order).toBe(-1);
    });
  });

  describe('PanelTypes constants', () => {
    it('defines all expected panel types', () => {
      expect(PanelTypes.Results).toBe('results');
      expect(PanelTypes.Schema).toBe('schema');
      expect(PanelTypes.Settings).toBe('settings');
      expect(PanelTypes.Console).toBe('console');
    });

    it('supports all panel types in constructor', () => {
      const types: PanelType[] = ['results', 'schema', 'settings', 'console'];

      types.forEach((type, index) => {
        const panel = new Panel({ id: `panel-${index}`, type });
        expect(panel.type).toBe(type);
      });
    });
  });

  describe('fromJSON', () => {
    it('creates instance from JSON payload', () => {
      const payload = {
        id: 'json-panel',
        type: 'schema' as PanelType,
        title: 'JSON Schema Panel',
        open: false,
        order: 3
      };

      const panel = Panel.fromJSON(payload);
      expect(panel.id).toBe('json-panel');
      expect(panel.type).toBe('schema');
      expect(panel.title).toBe('JSON Schema Panel');
      expect(panel.open).toBe(false);
      expect(panel.order).toBe(3);
    });

    it('handles minimal JSON payload', () => {
      const panel = Panel.fromJSON({
        id: 'minimal-json',
        type: PanelTypes.Console
      });

      expect(panel.id).toBe('minimal-json');
      expect(panel.type).toBe('console');
      expect(panel.open).toBe(true);
      expect(panel.order).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('serializes all fields correctly', () => {
      const json = testPanel.toJSON();

      expect(json.id).toBe('test-panel-1');
      expect(json.type).toBe('results');
      expect(json.title).toBe('Test Results Panel');
      expect(json.open).toBe(true);
      expect(json.order).toBe(1);
    });

    it('serializes minimal panel correctly', () => {
      const panel = new Panel({ id: 'minimal', type: PanelTypes.Settings });
      const json = panel.toJSON();

      expect(json.id).toBe('minimal');
      expect(json.type).toBe('settings');
      expect(json.title).toBeUndefined();
      expect(json.open).toBe(true);
      expect(json.order).toBe(0);
    });

    it('roundtrips correctly', () => {
      const json = testPanel.toJSON();
      const restored = Panel.fromJSON(json);

      expect(restored.id).toBe(testPanel.id);
      expect(restored.type).toBe(testPanel.type);
      expect(restored.title).toBe(testPanel.title);
      expect(restored.open).toBe(testPanel.open);
      expect(restored.order).toBe(testPanel.order);
    });
  });

  describe('toggle', () => {
    it('toggles open state from true to false', () => {
      expect(testPanel.open).toBe(true);
      const result = testPanel.toggle();
      expect(testPanel.open).toBe(false);
      expect(result).toBe(false);
    });

    it('toggles open state from false to true', () => {
      testPanel.open = false;
      const result = testPanel.toggle();
      expect(testPanel.open).toBe(true);
      expect(result).toBe(true);
    });

    it('can be toggled multiple times', () => {
      const initialState = testPanel.open;

      testPanel.toggle();
      expect(testPanel.open).toBe(!initialState);

      testPanel.toggle();
      expect(testPanel.open).toBe(initialState);

      testPanel.toggle();
      expect(testPanel.open).toBe(!initialState);
    });

    it('returns the new state after toggle', () => {
      testPanel.open = true;
      expect(testPanel.toggle()).toBe(false);
      expect(testPanel.toggle()).toBe(true);
    });
  });

  describe('openPanel', () => {
    it('sets open to true when panel is closed', () => {
      testPanel.open = false;
      testPanel.openPanel();
      expect(testPanel.open).toBe(true);
    });

    it('keeps open true when panel is already open', () => {
      testPanel.open = true;
      testPanel.openPanel();
      expect(testPanel.open).toBe(true);
    });

    it('does not return a value', () => {
      const result = testPanel.openPanel();
      expect(result).toBeUndefined();
    });
  });

  describe('closePanel', () => {
    it('sets open to false when panel is open', () => {
      testPanel.open = true;
      testPanel.closePanel();
      expect(testPanel.open).toBe(false);
    });

    it('keeps open false when panel is already closed', () => {
      testPanel.open = false;
      testPanel.closePanel();
      expect(testPanel.open).toBe(false);
    });

    it('does not return a value', () => {
      const result = testPanel.closePanel();
      expect(result).toBeUndefined();
    });
  });

  describe('panel state management workflow', () => {
    it('supports complete open/close/toggle workflow', () => {
      // Start with a fresh panel
      const panel = new Panel({ id: 'workflow', type: PanelTypes.Results });
      expect(panel.open).toBe(true);

      // Close it
      panel.closePanel();
      expect(panel.open).toBe(false);

      // Toggle it open
      panel.toggle();
      expect(panel.open).toBe(true);

      // Toggle it closed
      panel.toggle();
      expect(panel.open).toBe(false);

      // Open it explicitly
      panel.openPanel();
      expect(panel.open).toBe(true);
    });
  });

  describe('ordering and sorting', () => {
    it('supports negative order values', () => {
      const panel = new Panel({ id: 'negative', type: PanelTypes.Console, order: -5 });
      expect(panel.order).toBe(-5);
    });

    it('supports zero order value', () => {
      const panel = new Panel({ id: 'zero', type: PanelTypes.Schema, order: 0 });
      expect(panel.order).toBe(0);
    });

    it('supports large order values', () => {
      const panel = new Panel({ id: 'large', type: PanelTypes.Settings, order: 1000 });
      expect(panel.order).toBe(1000);
    });
  });
});
