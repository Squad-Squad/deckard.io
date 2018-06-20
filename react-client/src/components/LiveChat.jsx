import React from 'react';
import ReactDOM from 'react-dom';

class LiveChat extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        msg: '',
      }
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    updateMessage(e) {
        this.setState({
          msg: e.target.value,
        });
      }

    componentDidUpdate() {
        this.scrollToBottom();
    }
    
    scrollToBottom () {
      const scrollHeight = this.messageList.scrollHeight;
      const height = this.messageList.clientHeight;
      const maxScrollTop = scrollHeight - height;
      ReactDOM.findDOMNode(this.messageList).scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }

    handleKeyPress(event) {
        if (event.key == 'Enter') {
          if(this.state.msg) this.props.sendMessage(this.state.msg);
          this.setState({
            msg: ''
          })
        }
    }

    handleClick() {
      if (this.state.msg) this.props.sendMessage(this.state.msg);
        this.setState({
            msg: ''
        })
    }
  
    render() {
  
      return (
        <div id="chat">
          <h4 className="is-size-4">{this.props.roomName} Chatroom</h4>
          <div className="chat-messages" ref={(el) => { this.messageList = el;}}>
                {this.props.messages.map(message => {
                    if(this.props.username === message.name) {
                      return (<div className="section" style={{ textAlign: "right", backgroundColor: "#ffe6e6", borderTop: "1px solid black", padding: "5px" }}><p>{message.message}</p></div>)
                    } else {
                      return (<div className="section" style={{ textAlign: "left", backgroundColor: "#f0f5f5", borderTop: "1px solid black", padding: "5px" }}><p><strong>{message.name}:</strong>{message.message}</p></div>)
                    }
                })}
            </div> 
          <div>
            <span>
                  <input
                    type="text"
                    className="input is-primary is-small is-rounded"
                    value={this.state.msg}
                    onChange={this.updateMessage.bind(this)}
                    onKeyPress={this.handleKeyPress.bind(this)}
                    style={{width:'450px', marginTop:'15px', marginRight:'15px'}}
                  />
            </span>
            <button
              onClick={this.handleClick.bind(this)}
              className="button is-outlined is-primary is-small send-message"
              style={{marginTop:'15px'}}
            >
              Send
            </button>
          </div>
        </div>
      );
    }
  }
  
  export default LiveChat;