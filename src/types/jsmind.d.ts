declare module 'jsmind' {
    interface JsMindOptions {
        container: string;
        theme?: string;
        editable?: boolean;
        view?: {
            engine?: 'canvas' | 'svg';
            hmargin?: number;
            vmargin?: number;
            line_width?: number;
            line_color?: string;
        };
        layout?: {
            hspace?: number;
            vspace?: number;
            pspace?: number;
            direction?: 'side' | 'bottom' | 'top';
        };
    }

    interface JsMindData {
        meta: {
            name: string;
            author: string;
            version: string;
        };
        format: string;
        data: Array<{
            id: string;
            topic: string;
            parentid?: string;
            isroot?: boolean;
            direction?: 'left' | 'right';
            expanded?: boolean;
        }>;
    }

    class JsMind {
        constructor(options: JsMindOptions);
        show(data: JsMindData): void;
        get_selected_node(): any;
        select_node(node: any): void;
        add_node(parent_node: any, node_id: string, topic: string, data?: any, direction?: 'left' | 'right'): void;
        remove_node(node: any): void;
        update_node(node: any, topic: string): void;
        expand_node(node: any): void;
        collapse_node(node: any): void;
        is_node(node: any): boolean;
        move_node(node: any, before_id: string): void;
        get_node(node_id: string): any;
        get_data(): JsMindData;
    }

    export = JsMind;
} 