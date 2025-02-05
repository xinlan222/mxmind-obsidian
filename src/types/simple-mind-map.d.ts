declare module 'simple-mind-map' {
    interface MindMapNode {
        text: string;
        children?: MindMapNode[];
        [key: string]: any;
    }

    interface MindMapData {
        data: MindMapNode;
    }

    interface MindMapOptions {
        el: HTMLElement;
        data: MindMapData;
        layout?: {
            name: string;
            options: {
                direction: number;
                mindMap: {
                    nodeMargin: number;
                    levelMargin: number;
                };
            };
        };
        view?: {
            theme?: string;
            zoom?: number;
            draggable?: boolean;
            transformAnimation?: boolean;
            hoverRectColor?: string;
            selectNodeById?: boolean;
            expandBtnSize?: number;
            expandBtnColor?: string;
            nodeTextEditZIndex?: number;
            nodeTextEditAutoWrap?: boolean;
            customNoteContentShow?: boolean;
            maxTextWidth?: number;
            selectTextOnEnterEditText?: boolean;
            enableFreeDrag?: boolean;
            showScrollbar?: boolean;
        };
        theme?: {
            template: string;
            config: {
                paddingX: number;
                paddingY: number;
                fontSize: number;
                lineWidth: number;
                lineColor: string;
            };
        };
        shortcut?: {
            enable: boolean;
            shortcuts: Array<{
                type: string;
                key: string;
                ctrl?: boolean;
                shift?: boolean;
                alt?: boolean;
            }>;
        };
        watermark?: boolean;
        textEdit?: boolean;
        nodeTextEdit?: boolean;
        expandBtn?: boolean;
        nodeDataLength?: number;
        exportPng?: boolean;
        richText?: boolean;
        associativeLine?: boolean;
        keyboardNavigation?: boolean;
        dragNode?: boolean;
        dragCanvas?: boolean;
    }

    class MindMap {
        constructor(options: MindMapOptions);
        setData(data: MindMapData): void;
        execCommand(command: string, options?: any): void;
    }

    export default MindMap;
} 