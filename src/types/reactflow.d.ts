declare module 'reactflow' {
    import {ComponentType, ReactNode, HTMLAttributes} from 'react';
    import {Edge, Node, Connection} from '@reactflow/core';

    export * from '@reactflow/core';

    export interface ReactFlowProps extends HTMLAttributes<HTMLDivElement> {
        nodes: Node[];
        edges: Edge[];
        defaultNodes?: Node[];
        defaultEdges?: Edge[];
        onNodesChange?: (changes: any) => void;
        onEdgesChange?: (changes: any) => void;
        onConnect?: (connection: Connection) => void;
        onInit?: (instance: ReactFlowInstance) => void;
        onNodeClick?: (event: React.MouseEvent, node: Node) => void;
        onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
        nodeTypes?: Record<string, ComponentType<any>>;
        edgeTypes?: Record<string, ComponentType<any>>;
        fitView?: boolean;
        nodesDraggable?: boolean;
        nodesConnectable?: boolean;
        elementsSelectable?: boolean;
        snapToGrid?: boolean;
        snapGrid?: [number, number];
        defaultEdgeOptions?: any;
        connectionLineStyle?: any;
        deleteKeyCode?: string[] | null;
        children?: ReactNode;
    }

    export interface BackgroundProps {
        variant?: BackgroundVariant;
        gap?: number;
        size?: number;
        color?: string;
        style?: React.CSSProperties;
        id?: string;
    }

    export enum BackgroundVariant {
        Lines = 'lines',
        Dots = 'dots',
        Cross = 'cross',
    }

    export interface ReactFlowInstance {
        fitView: (options?: {padding?: number}) => void;
        zoomIn: () => void;
        zoomOut: () => void;
        project: (position: {x: number; y: number}) => {x: number; y: number};
    }

    const ReactFlow: ComponentType<ReactFlowProps>;
    export const Background: ComponentType<BackgroundProps>;
    export default ReactFlow;
}
