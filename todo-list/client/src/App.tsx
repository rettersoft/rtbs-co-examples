import React, { useRef, useEffect } from 'react';
import RBS, { RBSAuthChangedEvent, RBSAuthStatus, RbsRegion, RBSCloudObject } from '@rettersoft/rbs-sdk'

interface ToDoItem {
  id: number,
  text: string
  isCompleted: boolean
}

type MyProps = {}
type MyState = {
  todoItemText?: string
  items?: Array<ToDoItem>
}

class App extends React.Component<MyProps, MyState> {

  rbs?: RBS
  co?: RBSCloudObject

  constructor(props: any) {
    super(props);
    this.state = {
      items: []
    };
  }

  componentDidMount() {
    this.rbs = RBS.getInstance({
      projectId: '69ec1ef0039b4332b3e102f082a98ec2',
      region: RbsRegion.euWest1Beta
    })

    const setupRbs = async () => {
      this.co = await this.rbs?.getCloudObject({
        classId: 'ToDoList',
        instanceId: '01FN3F9DWWSB1NSF84A5CG4VRF'
      })
      this.co?.state.public?.subscribe((publicState: any) => {
        console.log("items", publicState)
        this.setState({
          items: publicState.items
        })
      })
    }

    setupRbs()
  }

  async addItem() {
    await this.co?.call({
      method: 'add',
      payload: {
        todoItem: this.state.todoItemText
      }
    })
  }

  async removeItem(id:number) {
    await this.co?.call({
      method: 'remove',
      payload: {
        id
      }
    })
  }

  async changeItemCompleted(id:number, isCompleted:boolean) {
    await this.co?.call({
      method: 'changeItemStatus',
      payload: {
        id, isCompleted
      }
    })
  }

  render() {
    const { items } = this.state

    return <div>
      <h1>My todo list</h1>
      <div>
        <input type="text" onChange={(e) => { this.setState({ todoItemText: e.target.value }) }} />
        <button onClick={() => this.addItem()}>Add item</button>
      </div>
      <div>
        <ul>
          {items?.map(i => {
            return <li>
              <input type="checkbox" checked={i.isCompleted} onChange={(e) => this.changeItemCompleted(i.id, !i.isCompleted)} /> 
                <span style={{textDecorationLine: i.isCompleted ? 'line-through' : ''}}>{i.text}</span> 
                <button onClick={() => this.removeItem(i.id)}>remove</button>
            </li>
          })}
        </ul>
      </div>
    </div>;
  }
}

export default App;