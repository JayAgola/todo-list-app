import React from 'react';

export default function Filter({current , onChange}){
    return (
        <div className="filter">
            <button onClick={() => onChange('all')} className= { current === 'all' ? 'active':''}>All</button>
            <button onClick={() => onChange('not started')} className= {current === 'not started' ? 'active':''}>Not Started</button> 
            <button onClick={() => onChange('in progress')} className={current === 'in progress' ?'active':''}>In Progress</button>
            <button onClick={() => onChange('completed')} className={current === 'completed' ? 'active':''}>Completed</button>
        </div>
    );
}