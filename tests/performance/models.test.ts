import { describe, it, expect } from 'vitest';
import UserSession from '../../src/models/UserSession';
import Panel from '../../src/models/Panel';
import { PanelTypes } from '../../src/models/Panel';

describe('Session and UI Performance Tests', () => {
  describe('UserSession Performance', () => {
    it('session creation and authentication checks are fast', async () => {
      const numSessions = 1000;
      const startTime = performance.now();

      const sessions: UserSession[] = [];
      for (let i = 0; i < numSessions; i++) {
        const session = new UserSession({
          userId: `user-${i}`,
          provider: 'google',
          accessToken: `token-${i}`,
          refreshToken: `refresh-${i}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        });

        // Perform authentication check
        session.isAuthenticated();
        sessions.push(session);
      }

      const creationTime = performance.now() - startTime;
      const avgTimePerSession = creationTime / numSessions;

      expect(sessions).toHaveLength(numSessions);
      expect(sessions.every(s => s.isAuthenticated())).toBe(true);
      expect(avgTimePerSession).toBeLessThan(0.5); // Should be sub-millisecond per session
      expect(creationTime).toBeLessThan(500); // Total time should be reasonable

      console.log(`Session creation performance:
        Total time: ${creationTime.toFixed(2)}ms
        Average per session: ${avgTimePerSession.toFixed(4)}ms`);
    });

    it('session serialization performance', async () => {
      const numOperations = 1000;

      const session = new UserSession({
        userId: 'performance-test-user',
        provider: 'google',
        accessToken: 'very-long-access-token-for-performance-testing-purposes',
        refreshToken: 'very-long-refresh-token-for-performance-testing-purposes',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      // Test serialization
      const serializeStart = performance.now();
      for (let i = 0; i < numOperations; i++) {
        session.toJSON();
      }
      const serializeTime = performance.now() - serializeStart;

      // Test deserialization
      const json = session.toJSON();
      const deserializeStart = performance.now();
      for (let i = 0; i < numOperations; i++) {
        UserSession.fromJSON(json);
      }
      const deserializeTime = performance.now() - deserializeStart;

      expect(serializeTime / numOperations).toBeLessThan(0.01); // Sub-10μs per serialization
      expect(deserializeTime / numOperations).toBeLessThan(0.01); // Sub-10μs per deserialization

      console.log(`Session serialization performance:
        Serialization: ${(serializeTime / numOperations).toFixed(4)}ms per operation
        Deserialization: ${(deserializeTime / numOperations).toFixed(4)}ms per operation`);
    });

    it('session clearing performance', async () => {
      const numSessions = 1000;
      const sessions: UserSession[] = [];

      // Create authenticated sessions
      for (let i = 0; i < numSessions; i++) {
        sessions.push(new UserSession({
          userId: `user-${i}`,
          accessToken: `token-${i}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }));
      }

      // Time clearing all sessions
      const startTime = performance.now();
      sessions.forEach(session => session.clear());
      const clearTime = performance.now() - startTime;

      const avgTimePerClear = clearTime / numSessions;

      expect(sessions.every(s => !s.isAuthenticated())).toBe(true);
      expect(avgTimePerClear).toBeLessThan(0.01); // Should be very fast

      console.log(`Session clearing performance:
        Total time: ${clearTime.toFixed(2)}ms
        Average per session: ${avgTimePerClear.toFixed(4)}ms`);
    });
  });

  describe('Panel Management Performance', () => {
    it('panel creation and state management is fast', async () => {
      const numPanels = 1000;
      const startTime = performance.now();

      const panels: Panel[] = [];
      for (let i = 0; i < numPanels; i++) {
        const panel = new Panel({
          id: `panel-${i}`,
          type: Object.values(PanelTypes)[i % 4], // Cycle through panel types
          title: `Performance Test Panel ${i}`,
          open: i % 2 === 0,
          order: i
        });

        // Perform state operations
        panel.toggle();
        panel.openPanel();
        panel.closePanel();
        panel.toJSON();

        panels.push(panel);
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerPanel = totalTime / numPanels;

      expect(panels).toHaveLength(numPanels);
      expect(panels.every(p => !p.open)).toBe(true); // All should be closed after closePanel()
      expect(avgTimePerPanel).toBeLessThan(0.1); // Should be very fast per panel

      console.log(`Panel management performance:
        Total time: ${totalTime.toFixed(2)}ms
        Average per panel: ${avgTimePerPanel.toFixed(4)}ms`);
    });

    it('panel toggling performance under load', async () => {
      const numToggles = 10000;
      const panel = new Panel({
        id: 'toggle-test',
        type: PanelTypes.Results,
        title: 'Toggle Performance Test'
      });

      const startTime = performance.now();
      for (let i = 0; i < numToggles; i++) {
        panel.toggle();
      }
      const toggleTime = performance.now() - startTime;

      const avgTimePerToggle = toggleTime / numToggles;

      // Should end up in original state (true) since we toggled even number of times
      expect(panel.open).toBe(true);
      expect(avgTimePerToggle).toBeLessThan(0.001); // Should be sub-microsecond per toggle

      console.log(`Panel toggling performance:
        Total time: ${toggleTime.toFixed(2)}ms
        Average per toggle: ${avgTimePerToggle.toFixed(6)}ms`);
    });

    it('bulk panel operations performance', async () => {
      const numPanels = 500;
      const panels: Panel[] = [];

      // Create panels
      for (let i = 0; i < numPanels; i++) {
        panels.push(new Panel({
          id: `bulk-panel-${i}`,
          type: PanelTypes.Results,
          title: `Bulk Panel ${i}`,
          order: i
        }));
      }

      // Test bulk opening
      const openStart = performance.now();
      panels.forEach(panel => panel.openPanel());
      const openTime = performance.now() - openStart;

      // Test bulk closing
      const closeStart = performance.now();
      panels.forEach(panel => panel.closePanel());
      const closeTime = performance.now() - closeStart;

      // Test bulk serialization
      const serializeStart = performance.now();
      const jsonData = panels.map(panel => panel.toJSON());
      const serializeTime = performance.now() - serializeStart;

      // Test bulk deserialization
      const deserializeStart = performance.now();
      const deserializedPanels = jsonData.map(json => Panel.fromJSON(json));
      const deserializeTime = performance.now() - deserializeStart;

      expect(panels.every(p => !p.open)).toBe(true);
      expect(deserializedPanels).toHaveLength(numPanels);

      expect(openTime / numPanels).toBeLessThan(0.01);
      expect(closeTime / numPanels).toBeLessThan(0.01);
      expect(serializeTime / numPanels).toBeLessThan(0.01);
      expect(deserializeTime / numPanels).toBeLessThan(0.01);

      console.log(`Bulk panel operations performance:
        Open: ${(openTime / numPanels).toFixed(4)}ms per panel
        Close: ${(closeTime / numPanels).toFixed(4)}ms per panel
        Serialize: ${(serializeTime / numPanels).toFixed(4)}ms per panel
        Deserialize: ${(deserializeTime / numPanels).toFixed(4)}ms per panel`);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('session objects are memory efficient', async () => {
      const numSessions = 5000;

      if (global.gc) {
        global.gc();
      }

      const startMemory = process.memoryUsage();

      const sessions: UserSession[] = [];
      for (let i = 0; i < numSessions; i++) {
        sessions.push(new UserSession({
          userId: `memory-test-user-${i}`,
          provider: 'google',
          accessToken: `memory-test-token-${i}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }));
      }

      const endMemory = process.memoryUsage();
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
      const memoryPerSession = memoryIncrease / numSessions;

      expect(sessions).toHaveLength(numSessions);
      expect(memoryPerSession).toBeLessThan(1024); // Should use less than 1KB per session

      console.log(`Session memory efficiency:
        Total increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
        Per session: ${memoryPerSession.toFixed(0)} bytes`);
    });

    it('panel objects are memory efficient', async () => {
      const numPanels = 5000;

      if (global.gc) {
        global.gc();
      }

      const startMemory = process.memoryUsage();

      const panels: Panel[] = [];
      for (let i = 0; i < numPanels; i++) {
        panels.push(new Panel({
          id: `memory-test-panel-${i}`,
          type: Object.values(PanelTypes)[i % 4],
          title: `Memory Test Panel ${i}`,
          order: i
        }));
      }

      const endMemory = process.memoryUsage();
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
      const memoryPerPanel = memoryIncrease / numPanels;

      expect(panels).toHaveLength(numPanels);
      expect(memoryPerPanel).toBeLessThan(512); // Should use less than 512 bytes per panel

      console.log(`Panel memory efficiency:
        Total increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
        Per panel: ${memoryPerPanel.toFixed(0)} bytes`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('concurrent session operations', async () => {
      const numConcurrentOps = 100;

      const sessionPromises = Array.from({ length: numConcurrentOps }, async (_, i) => {
        const session = new UserSession({
          userId: `concurrent-user-${i}`,
          accessToken: `concurrent-token-${i}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        });

        // Simulate rapid state changes
        for (let j = 0; j < 10; j++) {
          session.isAuthenticated();
          session.toJSON();
          UserSession.fromJSON(session.toJSON());
        }

        session.clear();
        return session;
      });

      const startTime = performance.now();
      const results = await Promise.all(sessionPromises);
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(numConcurrentOps);
      expect(results.every(s => !s.isAuthenticated())).toBe(true);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second

      console.log(`Concurrent session operations:
        Total time: ${totalTime.toFixed(2)}ms
        Operations: ${numConcurrentOps} concurrent sessions with 10 ops each`);
    });

    it('concurrent panel operations', async () => {
      const numConcurrentPanels = 100;

      const panelPromises = Array.from({ length: numConcurrentPanels }, async (_, i) => {
        const panel = new Panel({
          id: `concurrent-panel-${i}`,
          type: PanelTypes.Results,
          title: `Concurrent Panel ${i}`
        });

        // Simulate rapid state changes
        for (let j = 0; j < 20; j++) {
          panel.toggle();
          panel.toJSON();
        }

        return panel;
      });

      const startTime = performance.now();
      const results = await Promise.all(panelPromises);
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(numConcurrentPanels);
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms

      console.log(`Concurrent panel operations:
        Total time: ${totalTime.toFixed(2)}ms
        Operations: ${numConcurrentPanels} concurrent panels with 20 ops each`);
    });
  });
});
