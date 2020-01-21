import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import Downshift from 'downshift';

import { useInputState, IOption, Session, ISessionItemProps } from '../src';
import command from './command';

interface IProps extends ISessionItemProps {
  value?: string;
}

const Prompt = (props: IProps) => {
  const [state, update] = useInputState({ command });

  const onKeyUp = React.useCallback((e) => update({ index: e.target.selectionStart }), [update]);

  const run = React.useCallback(() => {
    if (!props.item || !state.run) {
      return;
    }

    props.item.insertAfter(state.run(), <Prompt {...props} value="" />).next();
  }, [props.item, state.run]);

  return (
    <Downshift
      isOpen
      inputValue={state.value}
      initialHighlightedIndex={0}
      defaultHighlightedIndex={0}
      onChange={(option: IOption) => {
        if (!option) {
          return;
        }

        update({
          value: `${option.inputValue} `,
          index: option.cursorTarget + 1,
        });
      }}
      itemToString={() => state.value}
    >
      {(ds) => (
        <div className="container">
          <div className="input-container">
            <input
              {...ds.getInputProps({
                autoFocus: true,
                spellCheck: false,
                placeholder: 'type a command',
                onKeyUp,
                onChange: ({ target }) => {
                  update({ value: target.value, index: target.selectionStart });
                },
                onKeyDown: (event) => {
                  if (event.key === 'Enter' && !state.options.length && state.run) {
                    run();
                  }
                },
              })}
            />
            <div className="menu-anchor">
              <div className="menu">
                <div className="menu-offset">{state.value.slice(0, state.index)}</div>
                <ul {...ds.getMenuProps()}>
                  {state.options.map((item, index) => (
                    <li
                      className={ds.highlightedIndex === index ? 'highlighted' : undefined}
                      {...ds.getItemProps({ key: item.value, index, item })}
                    >
                      {item.value}
                    </li>
                  ))}
                  {state.loading ? <li>loading...</li> : null}
                </ul>
              </div>
            </div>
          </div>
          {!true && (
            <pre style={{ fontSize: 10 }}>
              <code>{JSON.stringify({ state }, null, 2)}</code>
            </pre>
          )}
          <style jsx>
            {`
              input {
                background-color: transparent;
                border: 0 none;
                padding: 5px 0;
                display: block;
                width: 100%;
              }

              input:focus {
                outline: 0 none;
              }

              input,
              input::placeholder {
                color: inherit;
              }

              input,
              .menu-offset {
                font-size: 18px;
                font-family: 'IBM Plex Sans Condensed', sans-serif;
                font-family: 'IBM Plex Mono', monospace;
              }

              .menu {
                display: flex;
              }

              .menu-offset {
                flex: 0 0 auto;
                white-space: pre;
                visibility: hidden;
              }

              ul {
                padding: 0;
                margin: 0;
                list-style: none;
                background-color: rgba(255, 255, 255, 0.2);
              }

              li {
                white-space: nowrap;
              }

              .highlighted {
                background-color: rgba(255, 255, 255, 0.4);
              }
            `}
          </style>
        </div>
      )}
    </Downshift>
  );
};

const Example = () => (
  <div>
    <Session>
      <Prompt />
    </Session>
    <style jsx>
      {`
        div {
          padding: 10px;
          color: white;
          background-color: black;
          font-family: 'IBM Plex Sans', sans-serif;
        }
      `}
    </style>
  </div>
);

export default Example;
