'use client';

import {useSearchParams} from 'next/navigation';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import {Suspense} from 'react';

function PipelineCanvasContent() {
    const searchParams = useSearchParams();
    const template = searchParams.get('template');

    return <WorkflowBuilder templateId={template} />;
}

export default function PipelineCanvas() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PipelineCanvasContent />
        </Suspense>
    );
}
