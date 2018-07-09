import React, { Component } from 'react';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {

  };
}

class Splash extends Component {
  render() {
    const svg = '<svg viewBox="0 0 800 600">< symbol id = "s-text" ><text text-anchor="middle"x="50%"y="35%"class="text--line">Elastic</text><text text-anchor="middle"x="50%"y="68%"class="text--line2">Stroke</text></symbol ><g class="g-ants"><use xlink: href="#s-text"class="text-copy"></use><use xlink: href="#s-text"class="text-copy"></use><use xlink: href="#s-text"class="text-copy"></use><use xlink: href="#s-text"class="text-copy"></use><use xlink: href="#s-text"class="text-copy"></use></g ></svg > ';
    return (
      <div dangerouslySetInnerHTML={{ __html: svg }}>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(Splash);