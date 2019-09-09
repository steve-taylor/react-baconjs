import React from 'react';

export default class ErrorBoundary extends React.Component {
    static getDerivedStateFromError() {
        return {hasError: true};
    }

    state = {hasError: false};

    render() {
        return this.state.hasError ? (
            <div id="error">
                Error!
            </div>
        ) : this.props.children;
    }
}
