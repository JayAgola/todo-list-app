import React, { useState ,useRef} from 'react';

export default function TodoForm({ onAdd }){

    const [subject , setSubject] = useState('');
    const [description , setDescription] = useState('');
    const [dueDate , setDueDate] = useState('');
    const [status ,setStatus] = useState('not started');

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!subject)return;
        onAdd({
            id:Date.now(),
            subject,
            description,
            dueDate,
            status,
        });
        setSubject('');
        setDescription('');
        setDueDate('');
        setStatus('not started');
    };

    const formRef = useRef(null);


    const handleKeyDown = (e) => {
   if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission
    const form = formRef.current;
    const inputs = Array.from(form.querySelectorAll('input, select, button')).filter(el => el.type !== "hidden" && !el.disabled);

    const index = inputs.indexOf(e.target);
    if (index > -1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
   }
};
    
    return (
        <form ref={formRef} onSubmit = {handleSubmit} className = "todo-form">
            <input value = {subject} onChange={e => setSubject(e.target.value)} placeholder = "Subject" onKeyDown={e => handleKeyDown(e)} required />
            <input value = {description} onChange={e => setDescription(e.target.value)} placeholder = "Description" onKeyDown={e => handleKeyDown(e)}/>
            <input type="date" value={dueDate} onChange = {e =>setDueDate(e.target.value)} onKeyDown={e => handleKeyDown(e)}/>
            <select value={status} onChange = {e => setStatus(e.target.value)} onKeyDown={e=>handleKeyDown(e)}>
                <option value = "not started">Not Started</option>
                <option value = "in progress">In Progress</option>
                <option value = "completed">Completed</option>
            </select>
            <button type="submit">Add Task</button>
        </form>
    );
}
