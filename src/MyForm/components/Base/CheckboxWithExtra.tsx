import React,{Component} from 'react';
import {Checkbox} from 'antd';
import { FormConfig } from '../../interface';
import MyComponent from '../index';
import './CheckboxWithExtra.less';

interface CheckboxWithExtraProps {
  editors: Array<FormConfig>,
  checkboxValue: boolean,
  editorsValue: Array<any>,  // 以 {"0":"", "1": ""} 输入输出
  onChange: Function
}

export default class CheckboxWithExtra extends Component<CheckboxWithExtraProps>{

  handleChange = (value: any, name: string, index: number) => {
    const { checkboxValue, editorsValue, onChange } = this.props;
    if (name === "checkboxValue") {
      onChange({
        checkboxValue: value,
        editorsValue
      });
    } else if (name === "editorValue") {
      const newEditorsValue = editorsValue.map((editorValue:any) => editorValue);
      newEditorsValue[index] = value;
      onChange({
        checkboxValue,
        editorsValue: newEditorsValue
      })
    }
  }

  renderExtra = (editorsValue: Array<any>) => {
    const { editors = [] } = this.props;
    if (!editors || editors.length === 0) return null;
    return editors.map((editor: FormConfig, index: number) => {
      const RenderComponent = MyComponent[editor.input_type];
      return (
        <div key={index} className='extra-editors'>
          {editor.label ? (
            <span className='extra-editors-label'>{editor.label}</span>
          ) : null}
          <div className='editor'>
            <RenderComponent
              value={editorsValue === null ? null : editorsValue[index]}
              {...editor}
              onChange={(value: any) => this.handleChange(value, "editorValue", index)}
            />
          </div>
          <div className='unit'>
            <span>{editor.unit}</span>
          </div>
        </div>
      )
    })
  }

  render() {
    const { checkboxValue, editorsValue } = this.props;
    return (
      <div className='checkox-with-extra'>
        <div className='checkbox'>
          <Checkbox
            checked={checkboxValue}
            onChange={(e:any) => this.handleChange(e.target.checked, "checkboxValue", -1)}
          >{this.props.children}</Checkbox>
        </div>
        {checkboxValue ? this.renderExtra(editorsValue) : null}
      </div>
    )
  }
}