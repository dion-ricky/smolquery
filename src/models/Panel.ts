export type PanelType = 'results' | 'schema' | 'settings' | 'console';

export const PanelTypes = {
  Results: 'results' as PanelType,
  Schema: 'schema' as PanelType,
  Settings: 'settings' as PanelType,
  Console: 'console' as PanelType,
};

export interface PanelPayload {
  id: string;
  type: PanelType;
  title?: string;
  open?: boolean;
  order?: number;
}

export class Panel {
  id: string;
  type: PanelType;
  title?: string;
  open: boolean;
  order: number;

  constructor(payload: PanelPayload) {
    if (!payload || typeof payload !== 'object') throw new TypeError('Invalid Panel payload');
    this.id = payload.id;
    this.type = payload.type;
    this.title = payload.title;
    this.open = payload.open ?? true;
    this.order = typeof payload.order === 'number' ? payload.order : 0;
  }

  static fromJSON(json: PanelPayload) {
    return new Panel(json);
  }

  toJSON(): PanelPayload {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      open: this.open,
      order: this.order,
    };
  }

  toggle() {
    this.open = !this.open;
    return this.open;
  }

  openPanel() {
    this.open = true;
  }

  closePanel() {
    this.open = false;
  }
}

export default Panel;
