import React from 'react';
import {__DO_NOT_USE_OR_YOU_WILL_BE_HAUNTED_BY_SPOOKY_GHOSTS} from 'styled-components';
import {renderToHtml, StyledComponentsServerRenderer} from '../src';

import SimpleWidget1 from './data/hook/widgets/simple';
import NestedWidget1 from './data/hook/widgets/nested';
import NestedWithStylesWidget1 from './data/hook/widgets/nested-with-styles';

import SimpleWidget2 from './data/inject/widgets/simple';
import NestedWidget2 from './data/inject/widgets/nested';
import NestedWithStylesWidget2 from './data/inject/widgets/nested-with-styles';

import SimpleWidget3 from './data/no-context/widgets/simple';
import NestedWidget3 from './data/no-context/widgets/nested';
import NestedWithStylesWidget3 from './data/no-context/widgets/nested-with-styles';

import ThrowsDelayedErrorWidget from './data/inject/widgets/throws-delayed-error';
import ThrowsImmediateErrorWidget from './data/inject/widgets/throws-immediate-error';

import * as fetchBaseValue from './data/streams/fetch-base-value';
import * as fetchV from './data/streams/fetch-v';
import * as fetchW from './data/streams/fetch-w';

jest.mock('uuid/v1');
require('uuid/v1').mockImplementation(() => '0123456789abcdef');

const {StyleSheet} = __DO_NOT_USE_OR_YOU_WILL_BE_HAUNTED_BY_SPOOKY_GHOSTS; // I ain't afraid of no ghosts

describe('renderToHtml(widget)', () => {
    [
        {
            name: 'useWidgetState()',
            SimpleWidget: SimpleWidget1,
            NestedWidget: NestedWidget1,
            NestedWithStylesWidget: NestedWithStylesWidget1,
        },
        {
            name: '<Inject />',
            SimpleWidget: SimpleWidget2,
            NestedWidget: NestedWidget2,
            NestedWithStylesWidget: NestedWithStylesWidget2,
        },
        {
            name: 'No context',
            SimpleWidget: SimpleWidget3,
            NestedWidget: NestedWidget3,
            NestedWithStylesWidget: NestedWithStylesWidget3,
        },
    ].forEach(({
        name,
        SimpleWidget,
        NestedWidget,
        NestedWithStylesWidget,
    }) => {
        describe(name, () => {
            describe('simple widget', () => {
                let fetchBaseValueSpy;
                let html;

                beforeEach(() => {
                    fetchBaseValueSpy = jest.spyOn(fetchBaseValue, 'default');
                });

                afterEach(() => {
                    html = undefined;
                    fetchBaseValueSpy.mockRestore();
                });

                describe('with mount point className', () => {
                    beforeEach(async () => {
                        html = {body: await renderToHtml(<SimpleWidget power={4} />, {className: 'mount-point'})};
                    });

                    test('renders correctly', () => {
                        expect(html).toMatchSnapshot();
                    });

                    test('calls fetchBaseValue() once', () => {
                        expect(fetchBaseValueSpy.mock.calls).toHaveLength(1);
                    });
                });

                describe('without mount point className', () => {
                    beforeEach(async () => {
                        html = {body: await renderToHtml(<SimpleWidget power={4} />)};
                    });

                    test('renders correctly', () => {
                        expect(html).toMatchSnapshot();
                    });

                    test('calls fetchBaseValue() once', () => {
                        expect(fetchBaseValueSpy.mock.calls).toHaveLength(1);
                    });
                });
            });

            describe('nested widget', () => {
                let fetchBaseValueSpy;
                let fetchVSpy;
                let fetchWSpy;
                let html;

                beforeEach(async () => {
                    fetchBaseValueSpy = jest.spyOn(fetchBaseValue, 'default');
                    fetchVSpy = jest.spyOn(fetchV, 'default');
                    fetchWSpy = jest.spyOn(fetchW, 'default');
                    html = {body: await renderToHtml(<NestedWidget coefficient={9} />)};
                });

                afterEach(() => {
                    html = undefined;
                    fetchWSpy.mockRestore();
                    fetchVSpy.mockRestore();
                    fetchBaseValueSpy.mockRestore();
                });

                test('renders correctly', () => {
                    expect(html).toMatchSnapshot();
                });

                test('calls fetchBaseValue() once', () => {
                    expect(fetchBaseValueSpy.mock.calls).toHaveLength(1);
                });

                test('calls fetchVSpy() once', () => {
                    expect(fetchVSpy.mock.calls).toHaveLength(1);
                });

                test('calls fetchWSpy() once', () => {
                    expect(fetchWSpy.mock.calls).toHaveLength(1);
                });
            });

            describe('styled nested widget', () => {
                beforeEach(() => {
                    // Pretend we're on a server
                    StyleSheet.reset(true);
                });

                afterEach(() => {
                    // Stop pretending
                    StyleSheet.reset();
                });

                // TODO: Fix different sc-component-id on Travis
                test('renders correctly', async () => {
                    const renderer = new StyledComponentsServerRenderer();
                    const body = await renderToHtml(
                        <NestedWithStylesWidget coefficient={9} />,
                        {render: new StyledComponentsServerRenderer().render}
                    );

                    expect({head: renderer.getStyleTags(), body})
                        .toMatchSnapshot();
                });
            });

            describe('regular component', () => {
                describe('with mount point className', () => {
                    test('renders as a regular element', async () => {
                        expect({body: await renderToHtml(<div>Hello ;)</div>)}).toMatchSnapshot();
                    });
                });

                describe('without mount point className', () => {
                    test('renders as a regular element', async () => {
                        expect({body: await renderToHtml(<div>Hello ;)</div>, {className: 'mount-point'})}).toMatchSnapshot();
                    });
                });
            });
        });
    });

    describe('getData Observable produces an immediate error', () => {
        let originalConsoleError;
        let error;

        beforeEach(async () => {
            originalConsoleError = console.error;
            console.error = () => {};

            return renderToHtml(<ThrowsImmediateErrorWidget />).then(({body}) => body).catch((e) => {
                error = e;
            });
        });

        afterEach(() => {
            console.error = originalConsoleError;
        });

        test('propagates the error to the caller', () => {
            expect(error).toBe('Nope!');
        });
    });

    describe('getData Observable produces a delayed error', () => {
        let originalConsoleError;
        let error;

        beforeEach(async () => {
            originalConsoleError = console.error;
            console.error = () => {};

            return renderToHtml(<ThrowsDelayedErrorWidget />).then(({body}) => body).catch((e) => {
                error = e;
            });
        });

        afterEach(() => {
            console.error = originalConsoleError;
        });

        test('propagates the error to the caller', () => {
            expect(error).toBe('Nope!');
        });
    });

    // Needs more tests
    describe('onData', () => {
        let accumulatedData = {};

        afterEach(() => {
            accumulatedData = {};
        });

        describe('child overrides parent; last sibling wins', () => {
            beforeEach(() => {
                return renderToHtml(
                    <NestedWidget1 coefficient={9} />,
                    {
                        onData(data) {
                            Object.assign(accumulatedData, data);
                        },
                    }
                );
            });

            test('accumulates the expected data', () => {
                expect(accumulatedData).toMatchSnapshot();
            });
        });

        describe('parent overrides child; first sibling wins', () => {
            beforeEach(() => {
                return renderToHtml(
                    <NestedWidget1 coefficient={9} />,
                    {
                        onData(data) {
                            accumulatedData = {
                                ...data,
                                ...accumulatedData,
                            };
                        },
                    }
                );
            });

            test('accumulates the expected data', () => {
                expect(accumulatedData).toMatchSnapshot();
            });
        });
    });
});
