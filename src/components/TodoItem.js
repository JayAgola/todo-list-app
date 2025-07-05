import React, { useState } from 'react';

export default function TodoItem({ todo, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState(todo.subject);
  const [editDescription, setEditDescription] = useState(todo.description);
  const [editDate, setEditDate] = useState(todo.dueDate);
  const [editStatus, setEditStatus] = useState(todo.status);

  const handleSave = () => {
    onUpdate({
      ...todo,
      subject: editSubject,
      description: editDescription,
      dueDate: editDate,
      status: editStatus,
    });
    setIsEditing(false);
  };

  return (
    <div className={`todo-item ${todo.status.replace(/\s/g, '-')}`}>
      {isEditing ? (
        <>
          <input
            value={editSubject}
            onChange={(e) => setEditSubject(e.target.value)}
          />
          <input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            <option value="not started">Not Started</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={handleSave}>Save</button>
        </>
      ) : (
        <>
          <div>
            <strong>{todo.subject}</strong> - {todo.description}
            <div>Due: {todo.dueDate}</div>
            <div>Status: {todo.status}</div>
          </div>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button className="delete-btn" onClick={() => onDelete(todo.id)}>
            Delete
          </button>
        </>
      )}
    </div>
  );
}
