import React from 'react';
import './Tests.css';

const Tests = (props) => {
  console.log(props.currentExamId);
  return (
    <div>
      <div className = 'container test'>
        <h2>Tests</h2>
        {props.currentExamId ?
          <div>
            <section className='add-test'>
            {props.showAddTest ?
              <div>
                <form onSubmit={props.handleSubmit}>
                  <p>Test type:</p>
                  <select name="currentTypeId" value={props.currentTypeId} onChange={props.handleChange}>
                  {props.allTestTypes.map((type) => {
                    return (
                      <option name="type" key={type.id} value={type.id}>{type.name}</option>
                    )
                  })}
                  </select>

                  <p>"Weight on exam (Between 0.1 and 1):"</p>
                  <input required="required" type="number" step="0.1" min="0.1" max="1" name="weight" onChange={props.handleChange} value={props.weight ? props.weight : ''} />

                  <p>"Maximum score (Between 5 and 100)":</p>
                  <input required="required" type="number" min="5" max="100" name="maxValue" onChange={props.handleChange} value={props.maxValue ? props.maxValue : ''} />

                  <p>"Time (Between 1 and 180 minutes):"</p>
                  <input required="required" type="number" name="time" min="1" max = "180" onChange={props.handleChange} value={props.time ? props.time : ''} />

                  <p>Instructions:</p>
                  <textarea rows="3" maxLength="500" required="required" type="text" name="instructions" placeholder="Enter instructions for this test" onChange={props.handleChange} value={props.instructions}/>

                  {props.acceptButton ? <button className='success'><i className="fa fa-check-circle" aria-hidden="true"></i>Accept</button>
                  : <button className='success' disabled><i className="fa fa-check-circle" aria-hidden="true"></i>Accept</button>}

                  <button type="button" className='warning' onClick = {() => {props.showAddModule(false); props.clearFields();}}><i className="fa fa-times-circle" aria-hidden="true"></i>Cancel</button>
                </form>
              </div>
              :
              <button className='info' onClick = {() => {props.showAddModule(true); props.clearFields();}}><i className="fa fa-plus-circle" aria-hidden="true"></i>Add Test</button>
            }
            </section>

            <section className='edit-test'>
            {props.showEditTest ?
              <div>
                <form onSubmit={props.handleEdit}>
                <p>Weight:</p>
                <input required="required" type="number" step="0.1" min="0.1" max="1" name="weight" onChange={props.handleChange} value={props.weight} />

                <p>"Max value (Between 5 and 100)"</p>
                <input required="required" type="number" min="5" max="100" name="maxValue" onChange={props.handleChange} value={props.maxValue} />

                <p>"Time (minutes):"</p>
                <input required="required" type="number" name="time" min="1" max = "180" onChange={props.handleChange} value={props.time} />

                <p>Instructions:</p>
                <textarea rows="3" maxLength="500" required="required" type="text" name="instructions" placeholder="Enter instructions for this test" onChange={props.handleChange} value={props.instructions}/>

                  {props.editButton ? <button className='success'><i className="fa fa-check-circle" aria-hidden="true"></i>Accept</button>
                  : <button className='success' disabled><i className="fa fa-check-circle" aria-hidden="true"></i>Accept</button>}


                  <button type="button" className='warning' onClick = {() => {props.showEditModule(false); props.clearFields()}}><i className="fa fa-times-circle" aria-hidden="true"></i>Cancel</button>
                </form>
              </div>
              :
              <div></div>
            }
            </section>

            <section className = 'display-test'>
              <div className="wrapper display">
                <ul>
                  {props.tests.map((test) => {
                    let test_id = props.currentExamId + '-' + test.id;
                    var selected = '';
                    console.log("Comparacion", test.id, "+", props.currentTestId);
                    if(test.id === props.currentTestId) {
                      selected = 'selected';
                    }
                    return (
                      <li className={selected} key={test_id}>
                        <h3>{test.name}</h3>
                        <div>
                          <div className='test-info'>
                            <p><b>Description:</b></p>
                            <textarea rows="1" cols="50" value={test.description} readOnly></textarea>
                            <p><b>Time:</b> {test.time}</p>
                            <p><b>Weight:</b> {test.weight}</p>
                            <p><b>Max value:</b> {test.maxValue}</p>
                            <p><b>Instructions:</b></p>
                            <textarea rows="1" cols="50" value={test.instructions} readOnly></textarea>
                          </div>
                          <div className='test-actions'>
                            <button onClick={() => props.editTest(test)}><i className="fa fa-pencil" aria-hidden="true"></i>Edit</button>
                            <button className='danger' onClick={() => {props.removeTest(test.id); props.showAddModule(false); props.showEditModule(false); props.clearFields();}}><i className="fa fa-trash-o" aria-hidden="true"></i>Delete</button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          </div>
          :
          <p>Please select an exam.</p>
        }
      </div>
    </div>
  );
};

export default Tests;
