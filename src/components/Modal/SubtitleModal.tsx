import React from 'react';
import {
  Modal,
  Button,
  Icon,
  Radio,
  Checkbox,
  Header,
  Input,
} from 'semantic-ui-react';
import { Socket } from 'socket.io-client';
import { openFileSelector, serverPath } from '../../utils';
import config from '../../config';
import { MetadataContext } from '../../MetadataContext';

export class SubtitleModal extends React.Component<{
  closeModal: () => void;
  roomSubtitle: string | undefined;
  haveLock: () => boolean;
  roomMedia: string;
  socket: Socket;
  getMediaDisplayName: (input: string) => string;
  setSubtitleMode: (mode?: TextTrackMode) => void;
  getSubtitleMode: () => TextTrackMode;
}> {
  static contextType = MetadataContext;
  declare context: React.ContextType<typeof MetadataContext>;
  state = {
    loading: false,
    searchResults: [],
    titleQuery: this.props
      .getMediaDisplayName(this.props.roomMedia)
      .split('/')
      .slice(-1)[0],
  };

  async componentDidMount() {
    if (this.props.roomMedia.includes('/stream?torrent=magnet')) {
      const re = /&fileIndex=(\d+)$/;
      const match = re.exec(this.props.roomMedia);
      if (match) {
        const fileIndex = match[1];
        if (fileIndex) {
          // Fetch title from the data endpoint
          const response = await fetch(
            this.props.roomMedia.replace('/stream', '/data'),
          );
          const data = await response.json();
          this.setState({ titleQuery: data?.files[fileIndex]?.name });
        }
      }
    }
  }

  uploadSubtitle = async () => {
    const files = await openFileSelector('.srt');
    if (!files) {
      return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener('load', async (event) => {
      const subData = event.target?.result;
      // Upload to server
      const resp = await window.fetch(serverPath + '/subtitle', {
        method: 'POST',
        body: subData,
        headers: { 'Content-Type': 'text/plain' },
      });
      // Once URL obtained, make those the room subtitles
      const json = await resp.json();
      this.props.socket.emit(
        'CMD:subtitle',
        serverPath + '/subtitle/' + json.hash,
      );
    });
    reader.readAsText(file);
  };
  render() {
    const { closeModal } = this.props;
    return (
      <Modal open={true} onClose={closeModal}>
        <Modal.Header>Subtitles</Modal.Header>
        <Modal.Content image>
          <Modal.Description>
            <Checkbox
              toggle
              checked={this.props.getSubtitleMode() === 'showing'}
              label="Toggle subtitles for myself"
              onClick={(e, data) => {
                this.props.setSubtitleMode();
              }}
            />
            <hr />
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
            >
              <Header>Room subtitle settings</Header>
              {config.NODE_ENV === 'development' && (
                <Input value={this.props.roomSubtitle} />
              )}
              {
                <Input
                  value={this.state.titleQuery}
                  onChange={(e, { value }) =>
                    this.setState({ titleQuery: value })
                  }
                />
              }
              <div>
                <Button
                  loading={this.state.loading}
                  color="green"
                  disabled={!this.props.haveLock()}
                  icon
                  labelPosition="left"
                  size="mini"
                  onClick={async () => {
                    this.setState({ loading: true });
                    const resp = await window.fetch(
                      serverPath +
                        '/searchSubtitles?title=' +
                        this.state.titleQuery,
                    );
                    const json = await resp.json();
                    this.setState({ searchResults: json });
                    this.setState({ loading: false });
                  }}
                >
                  <Icon name="search" />
                  OpenSubtitles by Title
                </Button>
                <Button
                  loading={this.state.loading}
                  color="blue"
                  disabled={!this.props.haveLock()}
                  icon
                  labelPosition="left"
                  size="mini"
                  onClick={async () => {
                    this.setState({ loading: true });
                    const resp = await window.fetch(
                      serverPath +
                        '/searchSubtitles?url=' +
                        this.props.roomMedia,
                    );
                    const json = await resp.json();
                    this.setState({ searchResults: json });
                    this.setState({ loading: false });
                  }}
                >
                  <Icon name="search" />
                  OpenSubtitles by Hash
                </Button>
              </div>
              <div>
                <Radio
                  disabled={!this.props.haveLock()}
                  name="radioGroup"
                  label="No subtitles"
                  value=""
                  checked={!this.props.roomSubtitle}
                  onClick={(e, { value }) => {
                    this.props.socket.emit('CMD:subtitle', '');
                  }}
                />
              </div>
              <div>
                <Radio
                  disabled={!this.props.haveLock()}
                  name="radioGroup"
                  label=""
                  value=""
                  checked={
                    Boolean(this.props.roomSubtitle) &&
                    this.props.roomSubtitle?.startsWith(
                      serverPath + '/subtitle',
                    )
                  }
                />
                <Button
                  color="violet"
                  icon
                  labelPosition="left"
                  onClick={() => this.uploadSubtitle()}
                  disabled={!this.props.haveLock()}
                  size="mini"
                >
                  <Icon name="upload" />
                  Upload (.srt)
                </Button>
              </div>
              {this.state.searchResults.map(
                (result: {
                  id: string;
                  type: string;
                  attributes: Record<string, any>;
                }) => (
                  <div>
                    <Radio
                      disabled={!this.props.haveLock()}
                      label={result.attributes.release}
                      name="radioGroup"
                      value={result.attributes.files[0]?.file_id}
                      checked={
                        this.props.roomSubtitle ===
                        serverPath +
                          '/downloadSubtitles?file_id=' +
                          result.attributes.files[0]?.file_id
                      }
                      onChange={(e, { value }) => {
                        this.props.socket.emit(
                          'CMD:subtitle',
                          serverPath + '/downloadSubtitles?file_id=' + value,
                        );
                      }}
                    />
                  </div>
                ),
              )}
            </div>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    );
  }
}
