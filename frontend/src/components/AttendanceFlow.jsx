import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node to make it look nicer
const CustomNode = ({ data }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[120px] text-center font-bold text-sm ${
      data.status === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
      data.status === 'failed' ? 'bg-red-50 border-red-500 text-red-700' :
      data.status === 'neutral' ? 'bg-gray-50 border-gray-300 text-gray-700' :
      'bg-blue-50 border-blue-500 text-blue-700'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div>{data.label}</div>
      {data.subLabel && <div className="text-xs font-normal opacity-80 mt-1">{data.subLabel}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const AttendanceFlow = ({ attempt }) => {
  if (!attempt) return <div className="text-center p-4">No attempt data selected</div>;

  const { nodes, edges } = useMemo(() => {
    const nodesList = [];
    const edgesList = [];
    let yPos = 0;
    const xPos = 250;

    // 1. Start Node
    nodesList.push({
      id: 'start',
      type: 'custom',
      position: { x: xPos, y: yPos },
      data: { label: 'Start', status: 'neutral' }
    });
    yPos += 80;

    let previousId = 'start';

    // Helper to add steps
    const addStep = (id, label, verified, value = null) => {
      if (verified !== null && verified !== undefined) {
        nodesList.push({
          id,
          type: 'custom',
          position: { x: xPos, y: yPos },
          data: { 
            label, 
            status: verified ? 'success' : 'failed',
            subLabel: value ? `Val: ${typeof value === 'number' ? value.toFixed(2) : value}` : null
          }
        });
        edgesList.push({
            id: `e-${previousId}-${id}`,
            source: previousId,
            target: id,
            animated: true,
            style: { stroke: verified ? '#22c55e' : '#ef4444' }
        });
        yPos += 80;
        previousId = id;
      }
    };

    // 2. Add verification steps based on what is in the attempt
    addStep('geo', 'Location', attempt.location_verified, attempt.distance);
    addStep('face', 'Face Match', attempt.face_verified, attempt.face_score);
    addStep('liveness', 'Liveness', attempt.liveness_verified);
    addStep('biometric', 'Biometric', attempt.biometric_verified, attempt.biometric_type);
    addStep('qr', 'QR Code', attempt.qr_valid);

    // 3. Final Result
    nodesList.push({
      id: 'result',
      type: 'custom',
      position: { x: xPos, y: yPos },
      data: { 
        label: attempt.attempt_status, 
        status: attempt.attempt_status === 'SUCCESS' ? 'success' : 'failed',
        subLabel: attempt.fail_reason
      }
    });

    edgesList.push({
        id: `e-${previousId}-result`,
        source: previousId,
        target: 'result',
        animated: true,
        style: { stroke: attempt.attempt_status === 'SUCCESS' ? '#22c55e' : '#ef4444' }
    });

    return { nodes: nodesList, edges: edgesList };
  }, [attempt]);

  return (
    <div className="w-full h-[400px] border rounded-lg bg-white">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};


export default AttendanceFlow;