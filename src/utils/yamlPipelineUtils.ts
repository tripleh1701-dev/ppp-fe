import yaml from 'js-yaml';
import {Node, Edge} from 'reactflow';
import {api} from './api';
import {WorkflowNodeData} from '@/types/workflow';

// Pipeline YAML structure
export interface PipelineYAML {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        description?: string;
        enterprise?: string;
        entity?: string;
        deploymentType: 'Integration' | 'Extension';
        createdAt: string;
        updatedAt: string;
        version: string;
    };
    spec: {
        stages: PipelineStage[];
        variables?: Record<string, string>;
        notifications?: {
            email?: string[];
            slack?: string[];
            teams?: string[];
        };
        triggers?: {
            push?: boolean;
            pullRequest?: boolean;
            schedule?: string;
        };
    };
}

export interface PipelineStage {
    name: string;
    type: string;
    description?: string;
    dependsOn?: string[];
    config?: Record<string, any>;
    position?: {
        x: number;
        y: number;
    };
    notifications?: {
        email: boolean;
        slack: boolean;
    };
    status?: 'pending' | 'running' | 'completed' | 'failed';
    duration?: string;
}

/**
 * Convert React Flow nodes and edges to YAML pipeline format
 */
export function convertToYAML(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    metadata: {
        name: string;
        description?: string;
        enterprise?: string;
        entity?: string;
        deploymentType: 'Integration' | 'Extension';
    },
): string {
    // Create dependency map from edges
    const dependencies: Record<string, string[]> = {};
    edges.forEach((edge) => {
        if (!dependencies[edge.target]) {
            dependencies[edge.target] = [];
        }
        dependencies[edge.target].push(edge.source);
    });

    // Convert nodes to stages
    const stages: PipelineStage[] = nodes.map((node) => {
        const stage: PipelineStage = {
            name: node.data.label || `stage-${node.id}`,
            type: node.data.type,
            description: node.data.description,
            config: node.data.config || {},
            position: node.position,
            status: node.data.status,
            duration: node.data.duration,
        };

        // Add dependencies if any
        if (dependencies[node.id] && dependencies[node.id].length > 0) {
            // Map dependency node IDs to stage names
            stage.dependsOn = dependencies[node.id].map((depId) => {
                const depNode = nodes.find((n) => n.id === depId);
                return depNode?.data.label || `stage-${depId}`;
            });
        }

        // Add notifications if configured
        if (node.data.circularToggleConfig) {
            stage.notifications = {
                email:
                    node.data.circularToggleConfig.success.notifications
                        ?.email || false,
                slack:
                    node.data.circularToggleConfig.success.notifications
                        ?.slack || false,
            };
        }

        return stage;
    });

    const pipelineYAML: PipelineYAML = {
        apiVersion: 'pipeline/v1',
        kind: 'Pipeline',
        metadata: {
            name: metadata.name,
            description: metadata.description,
            enterprise: metadata.enterprise,
            entity: metadata.entity,
            deploymentType: metadata.deploymentType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0.0',
        },
        spec: {
            stages,
            variables: {},
            notifications: {
                email: [],
                slack: [],
                teams: [],
            },
            triggers: {
                push: false,
                pullRequest: false,
            },
        },
    };

    return yaml.dump(pipelineYAML, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
    });
}

/**
 * Convert YAML pipeline format back to React Flow nodes and edges
 */
export function convertFromYAML(yamlContent: string): {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
    metadata: PipelineYAML['metadata'];
} {
    try {
        const pipelineYAML = yaml.load(yamlContent) as PipelineYAML;

        if (!pipelineYAML || pipelineYAML.kind !== 'Pipeline') {
            throw new Error('Invalid pipeline YAML format');
        }

        const nodes: Node<WorkflowNodeData>[] = [];
        const edges: Edge[] = [];
        const stageNameToId: Record<string, string> = {};

        // Create nodes from stages
        pipelineYAML.spec.stages.forEach((stage, index) => {
            const nodeId = `node-${index + 1}`;
            stageNameToId[stage.name] = nodeId;

            const node: Node<WorkflowNodeData> = {
                id: nodeId,
                type: 'workflowNode',
                position: stage.position || {x: 300 + index * 250, y: 100},
                data: {
                    type: stage.type as any,
                    label: stage.name,
                    description: stage.description,
                    config: stage.config || {},
                    status: stage.status,
                    duration: stage.duration,
                },
            };

            // Add circular toggle config if notifications are present
            if (stage.notifications) {
                node.data.circularToggleConfig = {
                    success: {
                        message: 'Stage completed successfully!',
                        enabled: true,
                        notifications: {
                            email: stage.notifications.email,
                            slack: stage.notifications.slack,
                        },
                    },
                    warning: {
                        message: 'Stage completed with warnings',
                        enabled: true,
                        notifications: {
                            email: stage.notifications.email,
                            slack: stage.notifications.slack,
                        },
                    },
                    failure: {
                        message: 'Stage failed - check logs for details',
                        enabled: true,
                        notifications: {
                            email: stage.notifications.email,
                            slack: stage.notifications.slack,
                        },
                        actions: {
                            rollback: false,
                            retrigger: true,
                            notify: true,
                        },
                    },
                };
            }

            nodes.push(node);
        });

        // Create edges from dependencies
        pipelineYAML.spec.stages.forEach((stage, index) => {
            if (stage.dependsOn && stage.dependsOn.length > 0) {
                stage.dependsOn.forEach((dependency, depIndex) => {
                    const sourceId = stageNameToId[dependency];
                    const targetId = stageNameToId[stage.name];

                    if (sourceId && targetId) {
                        edges.push({
                            id: `edge-${sourceId}-${targetId}`,
                            source: sourceId,
                            target: targetId,
                            type: 'smoothstep',
                        });
                    }
                });
            }
        });

        return {
            nodes,
            edges,
            metadata: pipelineYAML.metadata,
        };
    } catch (error) {
        console.error('Error parsing YAML:', error);
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to parse pipeline YAML: ${errorMessage}`);
    }
}

/**
 * Save YAML pipeline to localStorage (for now)
 */
export async function savePipelineYAML(
    templateId: string,
    yamlContent: string,
): Promise<void> {
    await api.post(`/api/pipeline-yaml/${encodeURIComponent(templateId)}`, {
        yaml: yamlContent,
    });
}

/**
 * Load YAML pipeline from localStorage
 */
export async function loadPipelineYAML(
    templateId: string,
): Promise<string | null> {
    const res = await api.get<{templateId: string; yaml: string | null}>(
        `/api/pipeline-yaml/${encodeURIComponent(templateId)}`,
    );
    return res?.yaml ?? null;
}

/**
 * Get all available pipeline YAMLs
 */
export async function getAllPipelineYAMLs(): Promise<Record<string, string>> {
    return await api.get<Record<string, string>>(`/api/pipeline-yaml`);
}

/**
 * Delete pipeline YAML
 */
export async function deletePipelineYAML(templateId: string): Promise<void> {
    await api.del(`/api/pipeline-yaml/${encodeURIComponent(templateId)}`);
}

/**
 * Download YAML file to user's computer
 */
export function downloadYAML(yamlContent: string, filename: string): void {
    const blob = new Blob([yamlContent], {type: 'text/yaml'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
        filename.endsWith('.yaml') || filename.endsWith('.yml')
            ? filename
            : `${filename}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate a sample YAML for demonstration
 */
export function generateSampleYAML(): string {
    const samplePipeline: PipelineYAML = {
        apiVersion: 'pipeline/v1',
        kind: 'Pipeline',
        metadata: {
            name: 'sample-pipeline',
            description: 'A sample CI/CD pipeline',
            enterprise: 'Sample Corp',
            entity: 'Sample Project',
            deploymentType: 'Integration',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0.0',
        },
        spec: {
            stages: [
                {
                    name: 'source-code',
                    type: 'code_github',
                    description: 'Fetch source code from repository',
                    config: {
                        repository: 'https://github.com/example/repo',
                        branch: 'main',
                    },
                    position: {x: 300, y: 100},
                    notifications: {
                        email: true,
                        slack: false,
                    },
                },
                {
                    name: 'build-application',
                    type: 'build_jenkins',
                    description: 'Build the application',
                    dependsOn: ['source-code'],
                    config: {
                        buildCommand: 'npm run build',
                        outputPath: 'dist/',
                    },
                    position: {x: 550, y: 100},
                    notifications: {
                        email: true,
                        slack: true,
                    },
                },
                {
                    name: 'run-tests',
                    type: 'test_jest',
                    description: 'Run unit and integration tests',
                    dependsOn: ['build-application'],
                    config: {
                        testCommand: 'npm test',
                        coverageThreshold: 80,
                    },
                    position: {x: 800, y: 100},
                    notifications: {
                        email: true,
                        slack: true,
                    },
                },
                {
                    name: 'deploy-staging',
                    type: 'deploy_kubernetes',
                    description: 'Deploy to staging environment',
                    dependsOn: ['run-tests'],
                    config: {
                        environment: 'staging',
                        namespace: 'staging',
                    },
                    position: {x: 1050, y: 100},
                    notifications: {
                        email: true,
                        slack: true,
                    },
                },
            ],
            variables: {
                NODE_VERSION: '18',
                ENVIRONMENT: 'staging',
            },
            notifications: {
                email: ['admin@company.com'],
                slack: ['#devops'],
            },
            triggers: {
                push: true,
                pullRequest: true,
            },
        },
    };

    return yaml.dump(samplePipeline, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
    });
}
