import React, { useState } from 'react';

const AddMore = () => {
    const [todo, setTodo] = useState([]);

    const handleMore = e => {
        console.log('asd')
        const t = todo.slice(0);
        t.push({ key: '', value: '' })
        setTodo(t)
    }

    const handleInput = (e, key, index) => {
        const t = todo.slice(0);
        t[index][key] = e.target.value;
        setTodo(t)
    }

    const handleRemove = (index) => {
        const t = todo.slice(0);
        t.splice(index, 1);
        setTodo(t)
    }

    const handleSubmit = () => {
        console.log(todo);
    }

    return (
        <div>
            {todo.map((part, i) => (
                <div key={i}>
                    <input type="text" placeholder="key" value={part.key} onChange={e => handleInput(e, 'key', i)} />
                    <input type="text" placeholder="value" value={part.value} onChange={e => handleInput(e, 'value', i)} />
                    <button onClick={() => handleRemove(i)}>Remove</button>
                </div>
            ))}
            <button onClick={handleMore}>AddMore</button>
            <button onClick={handleSubmit}>Submit</button>
        </div>
    )
}

export default AddMore;