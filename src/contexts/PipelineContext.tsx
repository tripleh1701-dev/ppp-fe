'use client';

import React, {createContext, useContext, useState} from 'react';
import {api} from '@/utils/api';
import {CircularToggleConfig} from '@/types/workflow';

interface PipelineConfiguration {
    [nodeId: string]: CircularToggleConfig;
}

interface PipelineContextType {
    runPipeline: (() => Promise<void>) | null;
    setRunPipeline: (fn: (() => Promise<void>) | null) => void;
    isRunning: boolean;
    setIsRunning: (running: boolean) => void;
    pipelineConfig: PipelineConfiguration;
    updateNodeConfig: (nodeId: string, config: CircularToggleConfig) => void;
    savePipelineConfig: (config: PipelineConfiguration) => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | undefined>(
    undefined,
);

export function PipelineProvider({children}: {children: React.ReactNode}) {
    const [runPipeline, setRunPipeline] = useState<
        (() => Promise<void>) | null
    >(null);
    const [isRunning, setIsRunning] = useState(false);
    const [pipelineConfig, setPipelineConfig] = useState<PipelineConfiguration>(
        {},
    );

    const updateNodeConfig = (nodeId: string, config: CircularToggleConfig) => {
        setPipelineConfig((prev) => ({
            ...prev,
            [nodeId]: config,
        }));

        // Local-only update; backend API removed per requirements
    };

    const savePipelineConfig = async (
        config: PipelineConfiguration,
    ): Promise<void> => {
        // Local-only save; simply update context state
        setPipelineConfig(config);
    };

    // No remote load; start with empty/local state

    return (
        <PipelineContext.Provider
            value={{
                runPipeline,
                setRunPipeline,
                isRunning,
                setIsRunning,
                pipelineConfig,
                updateNodeConfig,
                savePipelineConfig,
            }}
        >
            {children}
        </PipelineContext.Provider>
    );
}

export function usePipeline() {
    const context = useContext(PipelineContext);
    if (context === undefined) {
        throw new Error('usePipeline must be used within a PipelineProvider');
    }
    return context;
}
