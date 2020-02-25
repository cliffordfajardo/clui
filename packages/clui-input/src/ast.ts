import { IToken } from './tokenizer';
import { ICommand, ICommands, IArg } from './types';

export type ASTNodeKind =
  | 'COMMAND'
  | 'ARG'
  | 'ARG_FLAG'
  | 'ARG_KEY'
  | 'ARG_VALUE'
  | 'REMAINDER'
  | 'PENDING';

export interface IArgKeyNode {
  kind: 'ARG_KEY';
  parent: IArgNode;
  token: IToken;
  name: string;
}

export interface IArgValueNode {
  kind: 'ARG_VALUE';
  parent: IArgNode;
  token: IToken;
}

export interface IArgFlagNode {
  kind: 'ARG_FLAG';
  ref: IArg;
  parent: ICmdNode;
  token: IToken;
  name: string;
}

export interface IArgNode {
  kind: 'ARG';
  ref: IArg;
  parent: ICmdNode;
  key: IArgKeyNode;
  value?: IArgValueNode;
}

export interface ICmdNode {
  kind: 'COMMAND';
  ref: ICommand;
  token: IToken;
  parent?: ICmdNode;
  command?: ICmdNode;
  args?: Array<IArgNode | IArgFlagNode>;
}

interface IRemainder {
  kind: 'REMAINDER';
  token: IToken;
  cmdNodeCtx?: ICmdNode;
  argNodeCtx?: IArgNode;
}

interface IPending {
  kind: 'PENDING';
  path: Array<string>;
  token: IToken;
  resolve: (str?: string) => Promise<ICommands>;
}

export interface IAst {
  command?: ICmdNode;
  remainder?: IRemainder;
  pending?: IPending;
}

export type ASTNode =
  | ICmdNode
  | IArgNode
  | IArgValueNode
  | IArgKeyNode
  | IArgFlagNode
  | IRemainder
  | IPending;

export const find = (ast: IAst, index: number): ASTNode | null => {
  const queue: Array<ASTNode> = [];
  if (ast.command) {
    queue.push(ast.command);
  }

  if (ast.remainder) {
    queue.push(ast.remainder);
  }

  if (ast.pending) {
    queue.push(ast.pending);
  }

  while (queue.length) {
    const node = queue.shift();

    if (!node) {
      throw Error('Expected node');
    }

    if (!('token' in node)) {
      throw Error('Expected token');
    }

    if (index >= node.token.start && index < node.token.end) {
      return node;
    }

    if ('args' in node && node.args) {
      for (const arg of node.args) {
        if ('token' in arg) {
          queue.push(arg);
        } else {
          queue.push(arg.key);

          if (arg.value) {
            queue.push(arg.value);
          }
        }
      }
    }

    if ('command' in node && node.command) {
      queue.push(node.command);
    }
  }

  return null;
};

export const closestPrevious = (ast: IAst, index: number): ASTNode | null => {
  let i = index;

  while (i > 0) {
    i--;
    const node = find(ast, i);

    if (node) {
      return node;
    }
  }

  return null;
};

export const commandPath = (root: ICmdNode): Array<ICmdNode> => {
  const path = [];

  let node: ICmdNode | void = root;

  while (node) {
    path.push(node);
    node = node.parent;
  }

  return path;
};

type ArgsMap = Record<string, string | boolean | number>;

export const toArgs = (
  command: ICmdNode,
): { parsed?: ArgsMap; remaining?: Array<IArg>; exhausted: boolean } => {
  const parsed: ArgsMap = {};

  if (!command.ref.args) {
    return { exhausted: true };
  }

  if (command.args) {
    for (const arg of command.args) {
      if (arg.kind === 'ARG_FLAG') {
        parsed[arg.name] = true;
      } else {
        const value = arg.value?.token.value;

        if (value) {
          parsed[arg.key.name] = arg.ref.type ? arg.ref.type(value) : value;
        }
      }
    }
  }

  const remaining: Array<IArg> = [];

  for (const key of Object.keys(command.ref.args)) {
    if (!parsed[key]) {
      remaining.push(command.ref.args[key]);
    }
  }

  return {
    parsed: Object.keys(parsed).length ? parsed : undefined,
    remaining: remaining.length ? remaining : undefined,
    exhausted: !remaining.length,
  };
};