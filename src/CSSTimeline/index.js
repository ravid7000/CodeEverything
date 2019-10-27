import React from 'react';
import './index.css';

const findSecondLarge = (arr) => {
    let secondLarge = -1
    if (!arr.length) {
        return secondLarge;
    }

    let i = 0;
    let len = arr.length;
    let first = -Infinity
    let second = -Infinity
    let equals = 0;
    while(i < len) {
        let current = arr[i];
        if (current === first) {
            equals += 1
        } else if (current > first) {
            // If current element is greater than first, then update second with first and first with current
            second = first;
            first = current;
        } else if (current > second) {
            // If current element is in between first and second, then update second
            second = current;
        }
        i += 1;
    }
    if (equals === arr.length - 1) {
        return secondLarge
    }
    return second
}

const errorMessages = {
    required: "This field is required.",
    email: "Please enter a valid email address.",
    url: "Please enter a valid URL.",
    date: "Please enter a valid date.",
    dateISO: "Please enter a valid date (ISO).",
    number: "Please enter a valid number.",
    equalTo: "Please enter the same value again.",
    maxlength: "Please enter no more than {0} characters.",
    minlength: "Please enter at least {0} characters.",
    range: "Please enter a value between {0} and {1}.",
    step: "Please enter a multiple of {0}."
}

const validator = (data, rules) => {

}

const rules = {
    first_name: {
        required: true,
        maxLength: 100,
    },
    phone: {
        required: true,
        number: true,
    }
}

const CSSTimeline = () => {
    const [padding, setPadding] = React.useState(10)

    return (
        <div style={{ padding: `${padding}px` }}>
            <button onClick={() => setPadding(padding + 10)}>Change Padding</button>
        </div>
    )
}

export default CSSTimeline;
